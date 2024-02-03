---
title: CV
layout: default
tags: page
modified: 2023-12-27 00:00:00
order: 1
---

<div>
  <h2 class="text-4xl font-extrabold dark:text-white">Experience</h2>
  <ul>
  {%- for experience in cv.experiences -%}
    <li>{{ experience.title }} at 
      <a href="{{ experience.company.url }}" class="hover:underline">
        {{ experience.company.name }}
      </a>
    </li>
  {%- endfor -%}
  </ul>
</div>

<div>
  <h2 class="text-4xl font-extrabold dark:text-white">Education</h2>
  <ul>
  {%- for education in cv.educations -%}
    <li>{{ education.title }}</li>
  {%- endfor -%}
  </ul>
</div>