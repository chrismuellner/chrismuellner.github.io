---
title: Setup ZFS for single-node Talos cluster
description: How to configure ZFS for a newly installed Talos Linux cluster.
pubDate: 2026-05-16
tags: [homelab, talos]
toc: 3
---

The simplest option to persist data across pod restarts in a simple cluster is persistent volumes backed by the [local path provisioner](https://github.com/rancher/local-path-provisioner). When I wanted to do more with these volumes I quickly ran into limitations, specifically it was not possible to take volume snapshots. 

[ZFS](https://github.com/openzfs/zfs) is a great filesystem and offers snapshot functionality out of the box, with the right installation this can be used in Kubernetes as well. There are countless better options for a production cluster, but this has been working well in my simple Homelab! I did the initial setup by following [this blog post](https://www.roosmaa.net/blog/2024/setting-up-zfs-on-talos/) by Mart Roosmaa, but wanted to extend on it.

## Prerequisites

The following should be available in your Homelab or installed on your local machine:

- A single machine/server with 1 disk.
- `talosctl` cli (can be installed by following [official instructions](https://docs.siderolabs.com/talos/v1.13/getting-started/talosctl))

> [!NOTE]
> This setup gives you snapshots on one node; if you need replication across nodes, look at [Longhorn](https://longhorn.io/docs) or [Mayastor](https://openebs.io/docs/user-guides/replicated-storage-user-guide/replicated-pv-mayastor/rs-overview).

Support for `RawVolumes` used in this guide was added in [Talos v1.11.0](https://github.com/siderolabs/talos/releases/tag/v1.11.0) so any version after that should be compatible. This guide is based on Talos v1.13.0!

## Setup

What steps are necessary to configure the Talos Linux node to support ZFS?

### Before you start

If your machine is not yet running Talos Linux, here's a quick guide on installing Talos on a new machine.

1. Using [Talos Linux Image Factory](https://factory.talos.dev/?arch=amd64&bootloader=auto&cmdline-set=true&extensions=-&extensions=siderolabs%2Fzfs&platform=metal&target=metal&version=1.13.0) find the correct install image
2. Flash ISO to bootable stick with something like [balenaEtcher](https://etcher.balena.io/)
3. Wait for machine to boot and be ready in maintenance mode. At this point it's easiest to connect a display directly to the machine to view logs and additional information like IP.
4. Store the IP of the machine in an environment variable so it can be reused later
```sh
export ENDPOINT="<IP>"
```

### 1. Create Config

> [!WARNING]
> Server should be running Talos, but Kubernetes cluster must not yet be bootstrapped. Volumes can only be configured on bootstrap!

Create Patch for Talos configuration, which will later be merged with the full Talos configuration when it's generated. This enables overriding existing fields and adding new ones. The image hash should be `4dd8e3a8b6203d3c14f049da8db4d3bb0d6d3e70c5e89dfcc1e709e81914f63c` to include the ZFS kernel module and is independent of the architecture and Talos versions.

> [!TIP]
> You can verify it by the [Talos Linux Image Factory](https://factory.talos.dev/) yourself, just make sure to select the `siderolabs/zfs` System Extension.

```yaml
machine:
  install:
    image: factory.talos.dev/metal-installer/4dd8e3a8b6203d3c14f049da8db4d3bb0d6d3e70c5e89dfcc1e709e81914f63c:v1.13.0
  kernel:
    modules:
    - name: zfs
cluster:
  allowSchedulingOnControlPlanes: true
```

`allowSchedulingOnControlPlanes` is required for single-node (only node is a controlplane node) clusters since by default no pods are scheduled on controlplane nodes.

Talos Linux has a set of [System Volumes](https://docs.siderolabs.com/talos/v1.13/configure-your-talos-cluster/storage-and-disk-management/disk-management/system) that can be configured and new [User](https://docs.siderolabs.com/talos/v1.13/configure-your-talos-cluster/storage-and-disk-management/disk-management/user) and [Raw Volumes](https://docs.siderolabs.com/talos/v1.13/configure-your-talos-cluster/storage-and-disk-management/disk-management/raw) can be added for use later:
- System Volume `EPHEMERAL` is used to store container data, logs and similar and by default uses all the space available on the disk. 
- Raw Volume `openebs-zfs` is used to store the ZFS pool and consequently persistent volume data.

Other System Volumes, like `STATE`, are created by Talos as well but are not relevant for this configuration.

> [!TIP]
> If your machine has multiple disks you shouldn't reuse the system disk! Both of the following volume configs use the same system disk since the assumption is that only a single disk is available.

The following examples are based on a single 1TB drive, so this sizing may be different for you. The [`EPHEMERAL` volume](https://docs.siderolabs.com/talos/v1.13/configure-your-talos-cluster/storage-and-disk-management/disk-management/system#ephemeral-volume) needs to be restricted by using `maxSize` [field](https://docs.siderolabs.com/talos/v1.13/configure-your-talos-cluster/storage-and-disk-management/disk-management/common#minimum-maximum-and-grow) so it doesn't fill up the whole disk.

```yaml
apiVersion: v1alpha1
kind: VolumeConfig
name: EPHEMERAL
provisioning:
  diskSelector:
    match: system_disk
  maxSize: 300GB # [!code highlight]
  grow: false # [!code highlight]
```

Reserve space on the same disk for the ZFS filesystem.

```yaml
apiVersion: v1alpha1
kind: RawVolumeConfig
name: openebs-zfs
provisioning:
  diskSelector:
    match: system_disk
  minSize: 500GB # [!code highlight]
```

[Raw Volumes](https://docs.siderolabs.com/talos/v1.13/configure-your-talos-cluster/storage-and-disk-management/disk-management/raw) in Talos create an unformatted partition for use by CSI Drivers, exactly what's needed so it can be used by the ZFS volume provisioner. Since the ZFS pool is located on a partition that Talos does not manage, it's also safe across restarts.

Store all these changes in a single file as `controlplane-patch.yaml`.

<details>
<summary>Complete patch file</summary>

```yaml
machine:
  install:
    image: factory.talos.dev/metal-installer/4dd8e3a8b6203d3c14f049da8db4d3bb0d6d3e70c5e89dfcc1e709e81914f63c:v1.13.0
  kernel:
    modules:
      - name: zfs
cluster:
  allowSchedulingOnControlPlanes: true
---
apiVersion: v1alpha1
kind: VolumeConfig
name: EPHEMERAL
provisioning:
  diskSelector:
    match: system_disk
  maxSize: 300GB
  grow: false
---
apiVersion: v1alpha1
kind: RawVolumeConfig
name: openebs-zfs
provisioning:
  diskSelector:
    match: system_disk
  minSize: 500GB
```

</details>

Generate secrets to get a reproducible configuration that allows regenerating the whole config later and store the file securely (do not share this publicly).
```sh
talosctl gen secrets -o secrets.yaml
```

Create config for a new cluster named `k8s` by using `talosctl` with the secret.
```sh
talosctl gen config k8s "https://${ENDPOINT}:6443" \
  --with-secrets "secrets.yaml" \
  --config-patch-control-plane @"controlplane-patch.yaml" \
  --output-types controlplane,talosconfig \
  --output "talos" \
  --with-examples=false \
  --with-docs=false
```

This will store the generated config (`controlplane.yaml` as machine config to bootstrap the cluster and `talosconfig` to allow connecting and interacting with it from the local machine) in the `talos` directory relative to the current directory.

> [!TIP]
> In the following section `--nodes` is passed as an argument to `talosctl` to tell Talos what address to talk to. Since this is a single node cluster with only a single IP, the `talosconfig` config file can be updated to remove the need to pass it every time.
> 
> ```yaml
> context: k8s
> contexts:
>   k8s:
>     endpoints:
>       - <ENDPOINT>
>     nodes:
>       - <ENDPOINT>
>     ca: ...
>     crt: ...
>     key: ...
>```

### 2. Bootstrap Cluster

Apply the config to the machine. `--insecure` is needed here since the API is still in maintenance mode and doesn't have a certificate yet.

```sh
talosctl apply-config --insecure --nodes "$ENDPOINT" \
  --file "talos/controlplane.yaml"
```

Bootstrap the cluster from the updated config.

```sh
talosctl bootstrap --nodes "$ENDPOINT"
```

Fetch kubeconfig so you can access the Kubernetes API.

```sh
talosctl kubeconfig --nodes "$ENDPOINT"
```

Wait for the node to be ready to continue.

```sh
kubectl get nodes -w
```

### 3. Configure ZFS

Create a privileged pod to modify the host's filesystem. Since Talos doesn't allow you to ssh onto the host, this is the only option to configure it. Namespace for the pod is not important, as long as it allows privileged pods.

```sh
kubectl run zfs-shell \
  --image=debian \
  --restart=Never \
  --overrides='{
    "spec": {
      "hostIPC": true,
      "hostNetwork": true,
      "hostPID": true,
      "containers": [{
        "name": "shell",
        "image": "debian",
        "command": ["sleep", "infinity"],
        "securityContext": {"privileged": true}
      }]
    }
  }'
```

Exec into the pod to run the following commands in a privileged context.

```sh
kubectl exec zfs-shell -it -- sh
```

Create the ZFS pool by running the command in the privileged container. Passing `legacy` tells ZFS that we'll take care of mount points. The location that the pool is created at is the name of the `RawVolumeConfig` created during [Talos config](#1-create-config) `openebs-zfs`, with `r-` prefixed.

```sh
nsenter --mount=/proc/1/ns/mnt -- zpool create \
  -m legacy \
  -f zfspv-pool \
  /dev/disk/by-partlabel/r-openebs-zfs
```

> [!TIP]
> Pool name used is `zfspv-pool` and can be changed, it just needs to be the same name later.

Verify that the ZFS pool is online by running the following command in the privileged container.

```sh
nsenter --mount=/proc/1/ns/mnt -- zpool status
```

<details>
<summary>Expected status output</summary>

```sh
  pool: zfspv-pool
 state: ONLINE
  scan: none requested
config:

	NAME             STATE     READ WRITE CKSUM
	zfspv-pool       ONLINE       0     0     0
	  r-openebs-zfs  ONLINE       0     0     0

errors: No known data errors
```

</details>

Now ZFS is ready on the host and can be used in Kubernetes!

Clean up the privileged pod after you are done.

```sh
kubectl delete pod zfs-shell
```

### 4. Use ZFS in Kubernetes

Create the following values file for the [OpenEBS umbrella chart](https://github.com/openebs/openebs/blob/develop/charts/values.yaml) with additional configuration for the [OpenEBS zfs-localpv chart](https://github.com/openebs/zfs-localpv/blob/develop/deploy/helm/charts/values.yaml) and store it as `values.yaml`. Most components can be disabled since they are not needed for ZFS to function.

```yaml
preUpgradeHook:
  enabled: false
localpv-provisioner:
  analytics:
    enabled: false
  localpv:
    enabled: false
  hostpathClass:
    enabled: false
openebs-crds:
  csi:
    volumeSnapshots:
      enabled: true
      keep: true
zfs-localpv: # [!code highlight]
  zfsNode: # [!code highlight]
    encrKeysDir: /var/openebs/keys # [!code highlight]
lvm-localpv:
  enabled: false
mayastor:
  enabled: false
engines:
  local:
    lvm:
      enabled: false
    zfs: # [!code highlight]
      enabled: true # [!code highlight]
  replicated:
    mayastor:
      enabled: false
loki:
  enabled: false
alloy:
  enabled: false
minio:
  enabled: false
```

Due to Talos not allowing the default directory to be writable, setting the `encrKeysDir` is required, otherwise the [CSI Driver cannot register on the node](https://github.com/openebs/zfs-localpv/issues/545).

Install the Helm chart. The command will wait for all pods to be in ready state and rollback if it takes too long (`--rollback-on-failure` since Helm v4, was `--atomic` in Helm v3).

```sh
helm install openebs oci://ghcr.io/openebs/dev/helm/openebs \
  --rollback-on-failure \
  -f values.yaml
```

`poolname` has to match with the name of the pool that was created in [Configure ZFS](#3-configure-zfs).

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: host-zfs # [!code highlight]
provisioner: zfs.csi.openebs.io
allowVolumeExpansion: true
parameters:
  poolname: "zfspv-pool" # [!code highlight]
  recordsize: "128k"
  compression: "lz4"
  dedup: "off"
  fstype: "zfs"
  shared: "yes"
```

All these values can be left as is, but keep in mind that they may not be ideal depending on what's running in the cluster. For example, `recordsize: "128k"` is appropriate for large sequential workloads but poor for databases. `shared: "yes"` allows same volume to be used by more than one pod, and can therefore be used to share configuration across pods.

On startup or reboot the Node registrar will check for the ZFS pool and import it for use in Kubernetes.

## Usage

The name of previously created `StorageClass` has to be used as `storageClassName` for any `PersistentVolumeClaims` that use it.

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: config
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: host-zfs # [!code highlight]
```

You can check that the setup works as expected by creating the example PVC, then checking the status of the resource and making sure it's `Bound`.

```sh
kubectl get pvc config
```

The data on the volume owned by this persistent volume claim will now be stored in the previously created ZFS pool on the host.

You can then create a `VolumeSnapshotClass` since the previously installed Helm chart already has everything required to use volume snapshots.

```yaml
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshotClass
metadata:
  name: host-zfs-snapshot
driver: zfs.csi.openebs.io
deletionPolicy: Delete
```

With this `VolumeSnapshotClass` the persistent volumes now support volume snapshots and can be used for backups, for example by using [VolSync and Kopia](/blog/01-volsync-backups).

## Summary

We've configured a new Talos Linux Cluster to use ZFS:
1. Configured Talos to provide enough space for a ZFS Pool
2. Created ZFS Pool on the Host
3. Used ZFS Pool with the OpenEBS Helm chart to back volumes

> [!TIP]
> All resources can be found in [chrismuellner/home-ops](https://github.com/chrismuellner/home-ops) which manages my personal Kubernetes cluster!

## Bonus

### Maintenance

It's recommended to regularly scrub all data in a ZFS pool to verify its correctness. This can be achieved by using [scrub](https://openzfs.github.io/openzfs-docs/man/master/8/zpool-scrub.8.html).

```sh
zpool scrub zfspv-pool
```

The easiest way to run this is via a privileged CronJob! This should be run regularly with output of `zpool status` checked and interpreted as well, but that's beyond the scope of this post.

> [!TIP]
> There's an example of what this job could look like in [Flux resources](https://github.com/chrismuellner/home-ops/tree/main/kubernetes/apps/system/zfs-scrub).