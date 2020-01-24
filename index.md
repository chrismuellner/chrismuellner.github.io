---
layout: default
---

<h2>Experience</h2>

<h2>Education</h2>
{% for education in site.educations %}
  <div class="education">
    <h4>{{ education.title }}</h4>
    <span class="date">
      {% if education.to %}
      {{ education.from }} - {{ education.to }}
      {% else %}
      since {{ education.from }}
      {% endif %}
    </span>
    <p>{{ education.content }}</p>
  </div>
{% endfor %}

<h2>Skills</h2>