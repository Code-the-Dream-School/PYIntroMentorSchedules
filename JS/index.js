// ---------------------------------------------------------------
  // EDIT THIS LIST to add, remove, or update mentors.
  // "role" is optional and just displays as a subtitle.
  // "slug" is the part of the Calendly URL after calendly.com/
  //   e.g. for https://calendly.com/ashley-ctd/30min  -> "ashley-ctd/30min"
  // ---------------------------------------------------------------
  const MENTORS = [
    // { name: "Anuja B", slug: "anuja-bujurge" },
    // { name: "Dylan F", slug: "dylan-ctd" },
    // { name: "Eduardo V", slug: "eduardo-ctd" },
    // { name: "Kira M", slug: "kiramiller425" },
    // { name: "Leam H", slug: "lema-hellali" },
    // { name: "Mario M", slug: "martinezest02" },
  ];

  const mentorListEl = document.getElementById('mentorList');
  const mentorNameEl = document.getElementById('mentorName');
  const embedWrap = document.getElementById('embedWrap');

  function initials(name) {
    return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  // Always points at the current month, so the site never goes stale.
  function currentMonthParam() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
  }

  function renderList() {
    mentorListEl.innerHTML = '';
    MENTORS.forEach((mentor, i) => {
      const li = document.createElement('li');
      li.className = 'mentor-item';
      li.id = `mentor-item-${i}`;
      li.innerHTML = `
        <button type="button" aria-pressed="false">
          <span class="avatar">${initials(mentor.name)}</span>
          <span>
            <span class="mentor-name">${mentor.name}</span>
          </span>
        </button>
      `;
      li.querySelector('button').addEventListener('click', () => selectMentor(i));
      mentorListEl.appendChild(li);
    });
  }

  function selectMentor(index) {
    const mentor = MENTORS[index];
    if (!mentor) return;

    // update active state
    document.querySelectorAll('.mentor-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`mentor-item-${index}`).classList.add('active');
    document.querySelectorAll('.mentor-item button').forEach(b => b.setAttribute('aria-pressed', 'false'));
    document.querySelector(`#mentor-item-${index} button`).setAttribute('aria-pressed', 'true');

    // update header text
    mentorNameEl.textContent = mentor.name;
   

    // build the Calendly URL with the current month baked in
    const url = `https://calendly.com/${mentor.slug}?month=${currentMonthParam()}&hide_gdpr_banner=1`;

    // rebuild the embed container fresh each time (Calendly's widget.js
    // scans the DOM for elements with this class on load)
    embedWrap.innerHTML = `<div class="calendly-inline-widget" data-url="${url}"></div>`;

    // Calendly's widget.js exposes a global helper to (re)initialize
    // an inline widget without a full page reload.
    if (window.Calendly && window.Calendly.initInlineWidget) {
      window.Calendly.initInlineWidget({
        url: url,
        parentElement: embedWrap.querySelector('.calendly-inline-widget'),
      });
    }
  }

  renderList();
  if (MENTORS.length > 0) {
    selectMentor(0);
  }