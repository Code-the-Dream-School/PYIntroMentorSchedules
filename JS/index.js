 // ---------------------------------------------------------------
  // Mentors load from mentors.json, which lives right alongside this
  // file in the repo. A GitHub Actions workflow (see
  // .github/workflows/update-mentors.yml) regenerates that file from
  // Airtable once an hour and commits it — so the Airtable token never
  // touches the browser, and this page just reads a static file.
  // ---------------------------------------------------------------
  const MENTORS_JSON_PATH = "./mentors.json";
 
  let MENTORS = [];
 
  // Fallback list used only if mentors.json is missing or empty, so the
  // page never shows completely blank. Edit or clear this as you like.
  const FALLBACK_MENTORS = [
    { name: "Mentor Names Coming Soon", slug: "mentor-ctd" },
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
            ${mentor.role ? `<span class="mentor-role">${mentor.role}</span>` : ''}
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
    mentorTaglineEl.textContent = mentor.role
      ? `${mentor.role} · availability for ${currentMonthParam()}`
      : `Availability for ${currentMonthParam()}`;
 
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
 
  async function loadMentors() {
    mentorListEl.innerHTML = '<li class="status-msg">Loading mentors…</li>';
    try {
      // cache: 'no-store' avoids the browser serving a stale cached
      // copy between hourly updates
      const resp = await fetch(MENTORS_JSON_PATH, { cache: 'no-store' });
      if (!resp.ok) throw new Error(`Request failed (${resp.status})`);
      const data = await resp.json();
      if (!data.mentors || !data.mentors.length) throw new Error('No mentors in mentors.json');
      MENTORS = data.mentors;
    } catch (err) {
      console.error('Failed to load mentors.json:', err);
      MENTORS = FALLBACK_MENTORS;
    }
    renderList();
    if (MENTORS.length > 0) {
      selectMentor(0);
    } else {
      embedWrap.innerHTML = '<div class="empty-state">No mentors are available right now.</div>';
    }
  }
 
  loadMentors();
