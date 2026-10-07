const STORAGE_KEY = "placement-progress-validator-demo-v1";
const STAGES = ["Applied", "Aptitude", "Technical", "HR", "Offer"];

let state = loadState();
let currentView = "profile";

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : clone(PPV_SEED);
  } catch (error) {
    return clone(PPV_SEED);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function student() {
  return state.students.find((item) => item.id === state.currentStudentId) || state.students[0];
}

function driveById(id) {
  return state.drives.find((drive) => drive.id === id);
}

function studentById(id) {
  return state.students.find((item) => item.id === id);
}

function studentApplications(studentId = state.currentStudentId) {
  return state.applications.filter((application) => application.studentId === studentId);
}

function skillList(profile) {
  return String(profile.skills || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizedSkillSet(profile) {
  return new Set(skillList(profile).map((item) => item.toLowerCase()));
}

function formatDate(value) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function stageIndex(stage) {
  return Math.max(0, STAGES.indexOf(stage));
}

function latestStage(applications) {
  if (!applications.length) return "Not applied";
  const max = applications.reduce((highest, application) => Math.max(highest, stageIndex(application.stage)), 0);
  return STAGES[max];
}

function readinessFactors(profile) {
  const results = state.mockResults[profile.id] || {};
  const mockCount = Object.values(results).filter((result) => result.passed).length;
  const skills = skillList(profile);
  const factors = [
    {
      label: "CGPA",
      score: Math.min(25, Math.round((Number(profile.cgpa) / 10) * 25)),
      max: 25,
      detail: `${profile.cgpa || 0}/10 academic score`
    },
    {
      label: "Backlogs",
      score: Number(profile.backlogs) === 0 ? 15 : Number(profile.backlogs) === 1 ? 8 : 0,
      max: 15,
      detail: `${profile.backlogs || 0} active backlog(s)`
    },
    {
      label: "Projects",
      score: Math.min(15, Number(profile.projects || 0) * 4),
      max: 15,
      detail: `${profile.projects || 0} project(s) added`
    },
    {
      label: "Skills",
      score: Math.min(20, skills.length * 3),
      max: 20,
      detail: `${skills.length} skill(s) listed`
    },
    {
      label: "Resume",
      score: profile.resumeName ? 10 : 0,
      max: 10,
      detail: profile.resumeName ? profile.resumeName : "Resume not uploaded"
    },
    {
      label: "Mock tests",
      score: Math.min(15, mockCount * 8),
      max: 15,
      detail: `${mockCount} mock test(s) passed`
    }
  ];
  return factors;
}

function readinessScore(profile) {
  return readinessFactors(profile).reduce((total, factor) => total + factor.score, 0);
}

function readinessTips(profile) {
  const tips = [];
  const skills = skillList(profile);
  const results = state.mockResults[profile.id] || {};
  if (Number(profile.cgpa) < 7.5) tips.push("Improve academic eligibility by targeting drives with CGPA criteria that match your current score.");
  if (Number(profile.backlogs) > 0) tips.push("Clear active backlogs because many higher package drives allow zero backlogs only.");
  if (Number(profile.projects) < 2) tips.push("Add one more practical project with a short resume-ready description.");
  if (skills.length < 5) tips.push("Add more job-ready skills such as DSA, SQL, JavaScript, Java, Python, React, or Excel.");
  if (!profile.resumeName) tips.push("Upload a resume file name so the profile passes resume-required drive checks.");
  if (!results.Aptitude?.passed || !results.Technical?.passed) tips.push("Pass both mock tests to show interview readiness and unlock progress movement.");
  return tips.length ? tips : ["Profile looks strong. Keep applying and updating interview outcomes."];
}

function validateEligibility(profile, drive) {
  const reasons = [];
  const skills = normalizedSkillSet(profile);
  const missingSkills = drive.requiredSkills.filter((skill) => !skills.has(skill.toLowerCase()));

  if (!drive.branches.includes(profile.branch)) reasons.push(`Branch ${profile.branch} is not allowed for this drive.`);
  if (!drive.years.includes(profile.year)) reasons.push(`${profile.year} students are not allowed for this drive.`);
  if (Number(profile.cgpa) < drive.minCgpa) reasons.push(`CGPA must be at least ${drive.minCgpa}.`);
  if (Number(profile.backlogs) > drive.maxBacklogs) reasons.push(`Backlogs must be ${drive.maxBacklogs} or less.`);
  if (Number(profile.projects) < drive.minProjects) reasons.push(`At least ${drive.minProjects} project(s) required.`);
  if (drive.resumeRequired && !profile.resumeName) reasons.push("Resume is required before applying.");
  if (missingSkills.length) reasons.push(`Missing required skill(s): ${missingSkills.join(", ")}.`);

  return {
    eligible: reasons.length === 0,
    reasons
  };
}

function applicationStatusClass(application) {
  const status = application.status.toLowerCase();
  if (status.includes("accepted")) return "accepted";
  if (status.includes("declined")) return "declined";
  if (status.includes("rejected")) return "rejected";
  if (status.includes("offer")) return "offer";
  return "pending";
}

function renderStageTimeline(application) {
  const current = stageIndex(application.stage);
  return `
    <div class="timeline" aria-label="Placement stage timeline">
      ${STAGES.map((stage, index) => {
        let className = index <= current ? "done" : "";
        if (index === current && application.status === "In Progress") className += " current";
        if (index === current && application.status === "Rejected") className += " rejected";
        if (index === 4 && ["Offer Received", "Offer Accepted"].includes(application.status)) className += " offer-stage";
        return `<div class="stage ${className.trim()}">${stage}</div>`;
      }).join("")}
    </div>
  `;
}

function profileInitials(profile) {
  return profile.name
    .split(" ")
    .map((item) => item[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function renderProfile() {
  const profile = student();
  const options = state.students.map((item) => `
    <option value="${item.id}" ${item.id === profile.id ? "selected" : ""}>${escapeHtml(item.name)} (${escapeHtml(item.enrollment)})</option>
  `).join("");

  app.innerHTML = `
    <section class="grid two">
      <div class="panel">
        <div class="section-head">
          <div>
            <h2>Student Registration and Profile</h2>
            <p class="muted">Fill the profile, save it, or register it as a new demo student. Resume file content is not uploaded; only the file name is saved in demo storage.</p>
          </div>
          <label class="field">
            <span>Switch demo student</span>
            <select id="studentSwitcher">${options}</select>
          </label>
        </div>

        <form id="profileForm">
          <div class="form-grid">
            <label class="field">
              <span>Full name</span>
              <input name="name" required value="${escapeHtml(profile.name)}" placeholder="Student name">
            </label>
            <label class="field">
              <span>Email</span>
              <input name="email" type="email" required value="${escapeHtml(profile.email)}" placeholder="student@college.edu">
            </label>
            <label class="field">
              <span>Phone</span>
              <input name="phone" required pattern="[0-9]{10}" value="${escapeHtml(profile.phone)}" placeholder="10 digit mobile number">
            </label>
            <label class="field">
              <span>Enrollment number</span>
              <input name="enrollment" required value="${escapeHtml(profile.enrollment)}" placeholder="BT26CSE014">
            </label>
            <label class="field">
              <span>Branch</span>
              <select name="branch">
                ${["CSE", "IT", "ECE", "ME", "Civil", "EEE"].map((branch) => `<option ${branch === profile.branch ? "selected" : ""}>${branch}</option>`).join("")}
              </select>
            </label>
            <label class="field">
              <span>Year</span>
              <select name="year">
                ${["2nd Year", "3rd Year", "4th Year"].map((year) => `<option ${year === profile.year ? "selected" : ""}>${year}</option>`).join("")}
              </select>
            </label>
            <label class="field">
              <span>CGPA</span>
              <input name="cgpa" type="number" min="0" max="10" step="0.1" required value="${escapeHtml(profile.cgpa)}">
            </label>
            <label class="field">
              <span>Active backlogs</span>
              <input name="backlogs" type="number" min="0" max="10" step="1" required value="${escapeHtml(profile.backlogs)}">
            </label>
            <label class="field">
              <span>Projects completed</span>
              <input name="projects" type="number" min="0" max="20" step="1" required value="${escapeHtml(profile.projects)}">
            </label>
            <label class="field">
              <span>Resume</span>
              <input name="resume" type="file" accept=".pdf,.doc,.docx">
            </label>
            <label class="field full">
              <span>Skills</span>
              <textarea name="skills" placeholder="Java, Python, SQL, DSA">${escapeHtml(profile.skills)}</textarea>
            </label>
          </div>

          <div class="form-actions">
            <button class="btn" type="submit" data-action="save">Save profile</button>
            <button class="btn secondary" type="submit" data-action="create">Register as new student</button>
          </div>
        </form>
      </div>

      <aside class="profile-card">
        <div class="avatar">${escapeHtml(profileInitials(profile))}</div>
        <div>
          <h2>${escapeHtml(profile.name)}</h2>
          <p class="muted">${escapeHtml(profile.branch)} - ${escapeHtml(profile.year)}</p>
        </div>
        <ul class="profile-list">
          <li><span>Email</span><strong>${escapeHtml(profile.email)}</strong></li>
          <li><span>Enrollment</span><strong>${escapeHtml(profile.enrollment)}</strong></li>
          <li><span>CGPA</span><strong>${escapeHtml(profile.cgpa)}</strong></li>
          <li><span>Backlogs</span><strong>${escapeHtml(profile.backlogs)}</strong></li>
          <li><span>Projects</span><strong>${escapeHtml(profile.projects)}</strong></li>
          <li><span>Resume</span><strong>${profile.resumeName ? escapeHtml(profile.resumeName) : "Missing"}</strong></li>
        </ul>
        <p class="small muted">This project stores demo records in the browser only. Refreshing keeps data; reset demo data restores the seed records.</p>
      </aside>
    </section>
  `;
}

function renderProgress() {
  const profile = student();
  const applications = studentApplications(profile.id);
  const factors = readinessFactors(profile);
  const score = readinessScore(profile);
  const offers = applications.filter((item) => item.status.includes("Offer") || item.status.includes("Accepted"));

  app.innerHTML = `
    <section class="grid three">
      <div class="metric-card"><span class="metric-value">${score}</span><span class="muted">Readiness score</span></div>
      <div class="metric-card"><span class="metric-value">${applications.length}</span><span class="muted">Applications submitted</span></div>
      <div class="metric-card"><span class="metric-value">${latestStage(applications)}</span><span class="muted">Current highest stage</span></div>
      <div class="metric-card"><span class="metric-value">${offers.length}</span><span class="muted">Offers received</span></div>
    </section>

    <section class="panel">
      <div class="section-head">
        <div>
          <h2>Placement Readiness Score</h2>
          <p class="muted">The score validates academics, backlogs, projects, skills, resume, and mock-test performance.</p>
        </div>
      </div>
      <div class="score-row">
        <div class="score-dial" style="--score:${score}"><strong>${score}</strong></div>
        <div class="factor-list">
          ${factors.map((factor) => `
            <div class="factor">
              <div><strong>${escapeHtml(factor.label)}</strong><br><span class="small muted">${escapeHtml(factor.detail)}</span></div>
              <div class="bar-track"><span class="bar-fill" style="width:${Math.round((factor.score / factor.max) * 100)}%"></span></div>
              <strong>${factor.score}/${factor.max}</strong>
            </div>
          `).join("")}
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="section-head">
        <div>
          <h2>Current Placement Progress Dashboard</h2>
          <p class="muted">Track every application from Applied to Offer. HR scheduling and offer decisions are handled here.</p>
        </div>
      </div>
      ${applications.length ? `<div class="card-list">${applications.map(renderApplicationCard).join("")}</div>` : `
        <div class="empty-state">
          <h3>No applications yet</h3>
          <p class="muted">Go to Drive Eligibility and apply to an eligible drive.</p>
        </div>
      `}
    </section>

    <section class="panel">
      <h2>Validation Tips</h2>
      <ul class="reason-list">
        ${readinessTips(profile).map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}
      </ul>
    </section>
  `;
}

function renderApplicationCard(application) {
  const drive = driveById(application.driveId);
  const canScheduleHr = application.stage === "HR" && application.status === "In Progress";
  const canDecideOffer = application.stage === "Offer" && application.status === "Offer Received";

  return `
    <article class="application-card">
      <div class="application-top">
        <div>
          <h3>${escapeHtml(drive.company)} - ${escapeHtml(drive.role)}</h3>
          <div class="meta-row">
            <span class="badge">Package ${drive.packageLpa} LPA</span>
            <span class="badge gold">Visit ${escapeHtml(drive.visitDate)}</span>
            <span class="badge blue">Stage ${escapeHtml(application.stage)}</span>
          </div>
        </div>
        <span class="status-pill ${applicationStatusClass(application)}">${escapeHtml(application.status)}</span>
      </div>
      ${renderStageTimeline(application)}
      <p class="small muted">${escapeHtml(application.notes || "Progress is being validated.")}</p>
      ${application.hrSlot ? `<p><strong>HR slot:</strong> ${escapeHtml(formatDate(application.hrSlot))}</p>` : ""}
      ${canScheduleHr ? `
        <div class="hr-box">
          <label class="field">
            <span>HR date and time</span>
            <input type="datetime-local" data-hr-slot="${application.id}">
          </label>
          <button class="btn secondary" type="button" data-action="schedule-hr" data-id="${application.id}">Schedule HR</button>
          <button class="btn warning" type="button" data-action="receive-offer" data-id="${application.id}">HR cleared</button>
        </div>
      ` : ""}
      ${canDecideOffer ? `
        <div class="offer-actions">
          <button class="btn success" type="button" data-action="accept-offer" data-id="${application.id}">Accept offer</button>
          <button class="btn danger" type="button" data-action="decline-offer" data-id="${application.id}">Decline offer</button>
        </div>
      ` : ""}
    </article>
  `;
}

function renderDrives() {
  const profile = student();
  const applications = studentApplications(profile.id);

  app.innerHTML = `
    <section class="panel">
      <div class="section-head">
        <div>
          <h2>Drive Eligibility Validation</h2>
          <p class="muted">Each company is checked against branch, year, CGPA, backlogs, projects, resume, and skills. Ineligible drives show exact reasons.</p>
        </div>
        <span class="badge gold">Viewing ${escapeHtml(profile.name)}</span>
      </div>
      <div class="card-list">
        ${state.drives.map((drive) => {
          const validation = validateEligibility(profile, drive);
          const existing = applications.find((application) => application.driveId === drive.id);
          return `
            <article class="drive-card">
              <div class="drive-top">
                <div>
                  <h3>${escapeHtml(drive.company)} - ${escapeHtml(drive.role)}</h3>
                  <div class="meta-row">
                    <span class="badge">Package ${drive.packageLpa} LPA</span>
                    <span class="badge gold">Visit ${escapeHtml(drive.visitDate)}</span>
                    <span class="badge blue">Seats ${drive.seats}</span>
                    <span class="badge">CGPA ${drive.minCgpa}+</span>
                    <span class="badge">Max backlogs ${drive.maxBacklogs}</span>
                  </div>
                  <p class="small muted">Branches: ${drive.branches.join(", ")} | Skills: ${drive.requiredSkills.join(", ")}</p>
                </div>
                <div>
                  <span class="status-pill ${validation.eligible ? "eligible" : "not-eligible"}">${validation.eligible ? "Eligible" : "Not eligible"}</span>
                </div>
              </div>
              ${validation.reasons.length ? `
                <ul class="reason-list">
                  ${validation.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}
                </ul>
              ` : `<p class="small muted">All criteria are satisfied for this drive.</p>`}
              <div class="form-actions">
                <button class="btn" type="button" data-action="apply-drive" data-id="${drive.id}" ${!validation.eligible || existing ? "disabled" : ""}>
                  ${existing ? "Already applied" : validation.eligible ? "Apply to drive" : "Cannot apply"}
                </button>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderTests() {
  const profile = student();
  const results = state.mockResults[profile.id] || {};

  app.innerHTML = `
    <section class="panel">
      <div class="section-head">
        <div>
          <h2>Aptitude and Technical Mock Tests</h2>
          <p class="muted">Passing tests updates placement progress: Aptitude pass moves eligible applications to Technical, and Technical pass moves them to HR.</p>
        </div>
      </div>
      <div class="card-list">
        ${state.tests.map((test) => {
          const result = results[test.type];
          return `
            <article class="test-card">
              <div class="test-top">
                <div>
                  <h3>${escapeHtml(test.title)}</h3>
                  <p class="muted">${test.questions.length} questions | Pass score ${test.passScore}%</p>
                  ${result ? `<span class="status-pill ${result.passed ? "accepted" : "rejected"}">Last score ${result.score}% - ${result.passed ? "Passed" : "Needs practice"}</span>` : `<span class="status-pill pending">Not attempted</span>`}
                </div>
                <button class="btn" type="button" data-action="start-test" data-id="${test.id}">${result ? "Retake test" : "Start test"}</button>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderQuiz(testId) {
  const test = state.tests.find((item) => item.id === testId);
  app.innerHTML = `
    <section class="panel">
      <div class="section-head">
        <div>
          <h2>${escapeHtml(test.title)}</h2>
          <p class="muted">Select one answer for each question. Your score will be saved in localStorage demo storage.</p>
        </div>
        <button class="btn secondary" type="button" data-action="back-tests">Back to tests</button>
      </div>
      <form id="quizForm" class="quiz-form" data-test="${test.id}">
        ${test.questions.map((question, questionIndex) => `
          <fieldset class="question">
            <legend><strong>Q${questionIndex + 1}. ${escapeHtml(question.text)}</strong></legend>
            ${question.options.map((option, optionIndex) => `
              <label class="option">
                <input type="radio" name="q${questionIndex}" value="${optionIndex}" required>
                ${escapeHtml(option)}
              </label>
            `).join("")}
          </fieldset>
        `).join("")}
        <div class="form-actions">
          <button class="btn" type="submit">Submit test</button>
        </div>
      </form>
    </section>
  `;
}

function renderTeacher() {
  const placedIds = new Set(state.applications
    .filter((application) => ["Offer Received", "Offer Accepted"].includes(application.status))
    .map((application) => application.studentId));
  const acceptedOffers = state.applications.filter((application) => application.status === "Offer Accepted");
  const branchRows = branchStatistics();
  const averagePackage = acceptedOffers.length
    ? (acceptedOffers.reduce((total, application) => total + Number(application.offerAmount || driveById(application.driveId).packageLpa), 0) / acceptedOffers.length).toFixed(1)
    : "0.0";

  app.innerHTML = `
    <section class="grid three">
      <div class="metric-card"><span class="metric-value">${state.students.length}</span><span class="muted">Registered students</span></div>
      <div class="metric-card"><span class="metric-value">${state.applications.length}</span><span class="muted">Total applications</span></div>
      <div class="metric-card"><span class="metric-value">${Math.round((placedIds.size / state.students.length) * 100)}%</span><span class="muted">Placement rate</span></div>
      <div class="metric-card"><span class="metric-value">${averagePackage} LPA</span><span class="muted">Average accepted package</span></div>
    </section>

    <section class="panel">
      <div class="section-head">
        <div>
          <h2>Branch Statistics</h2>
          <p class="muted">Placement-cell overview for teacher demonstration.</p>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Branch</th>
              <th>Students</th>
              <th>Applications</th>
              <th>Offer students</th>
              <th>Placement rate</th>
              <th>Average readiness</th>
            </tr>
          </thead>
          <tbody>
            ${branchRows.map((row) => `
              <tr>
                <td>${escapeHtml(row.branch)}</td>
                <td>${row.students}</td>
                <td>${row.applications}</td>
                <td>${row.offers}</td>
                <td>${row.rate}%</td>
                <td>${row.readiness}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel">
      <div class="section-head">
        <div>
          <h2>Applications and Actions</h2>
          <p class="muted">Teachers can advance a student, reject an application, or issue an offer for demo purposes.</p>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Branch</th>
              <th>Company</th>
              <th>Stage</th>
              <th>Status</th>
              <th>HR slot</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${state.applications.map((application) => {
              const profile = studentById(application.studentId);
              const drive = driveById(application.driveId);
              return `
                <tr>
                  <td>${escapeHtml(profile.name)}</td>
                  <td>${escapeHtml(profile.branch)}</td>
                  <td>${escapeHtml(drive.company)}</td>
                  <td>${escapeHtml(application.stage)}</td>
                  <td>${escapeHtml(application.status)}</td>
                  <td>${escapeHtml(formatDate(application.hrSlot))}</td>
                  <td class="actions">
                    <button class="btn secondary" type="button" data-action="teacher-advance" data-id="${application.id}">Advance</button>
                    <button class="btn warning" type="button" data-action="teacher-offer" data-id="${application.id}">Offer</button>
                    <button class="btn danger" type="button" data-action="teacher-reject" data-id="${application.id}">Reject</button>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function branchStatistics() {
  const branches = [...new Set(state.students.map((item) => item.branch))].sort();
  return branches.map((branch) => {
    const students = state.students.filter((item) => item.branch === branch);
    const ids = new Set(students.map((item) => item.id));
    const applications = state.applications.filter((application) => ids.has(application.studentId));
    const offerIds = new Set(applications
      .filter((application) => ["Offer Received", "Offer Accepted"].includes(application.status))
      .map((application) => application.studentId));
    const readiness = students.length
      ? Math.round(students.reduce((total, item) => total + readinessScore(item), 0) / students.length)
      : 0;

    return {
      branch,
      students: students.length,
      applications: applications.length,
      offers: offerIds.size,
      rate: students.length ? Math.round((offerIds.size / students.length) * 100) : 0,
      readiness
    };
  });
}

function render() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.view === currentView);
  });

  if (currentView === "profile") renderProfile();
  if (currentView === "progress") renderProgress();
  if (currentView === "drives") renderDrives();
  if (currentView === "tests") renderTests();
  if (currentView === "teacher") renderTeacher();
}

function updateProfile(form, createNew) {
  const data = new FormData(form);
  const existing = createNew ? null : student();
  const resumeFile = data.get("resume");
  const profile = {
    id: existing?.id || `STU${Date.now().toString().slice(-6)}`,
    name: data.get("name").trim(),
    email: data.get("email").trim(),
    phone: data.get("phone").trim(),
    enrollment: data.get("enrollment").trim(),
    branch: data.get("branch"),
    year: data.get("year"),
    cgpa: Number(data.get("cgpa")),
    backlogs: Number(data.get("backlogs")),
    projects: Number(data.get("projects")),
    skills: data.get("skills").trim(),
    resumeName: resumeFile && resumeFile.name ? resumeFile.name : existing?.resumeName || ""
  };

  if (createNew) {
    state.students.push(profile);
    state.currentStudentId = profile.id;
    state.mockResults[profile.id] = {};
    showToast("New student registered in demo storage.");
  } else {
    const index = state.students.findIndex((item) => item.id === profile.id);
    state.students[index] = profile;
    showToast("Student profile saved.");
  }

  saveState();
  render();
}

function applyToDrive(driveId) {
  const profile = student();
  const drive = driveById(driveId);
  const validation = validateEligibility(profile, drive);
  const alreadyApplied = state.applications.some((application) => application.studentId === profile.id && application.driveId === driveId);

  if (!validation.eligible || alreadyApplied) return;

  state.applications.push({
    id: `APP${Date.now().toString().slice(-6)}`,
    studentId: profile.id,
    driveId,
    stage: "Applied",
    status: "In Progress",
    hrSlot: "",
    offerDecision: "",
    offerAmount: 0,
    notes: "Application submitted after eligibility validation."
  });
  saveState();
  showToast(`Applied to ${drive.company}.`);
  render();
}

function scheduleHr(applicationId) {
  const application = state.applications.find((item) => item.id === applicationId);
  const input = document.querySelector(`[data-hr-slot="${applicationId}"]`);
  if (!application || !input?.value) {
    showToast("Select an HR date and time first.");
    return;
  }
  application.hrSlot = input.value;
  application.notes = "HR interview scheduled by student.";
  saveState();
  showToast("HR schedule saved.");
  render();
}

function receiveOffer(applicationId) {
  const application = state.applications.find((item) => item.id === applicationId);
  const drive = driveById(application.driveId);
  application.stage = "Offer";
  application.status = "Offer Received";
  application.offerAmount = drive.packageLpa;
  application.notes = "Offer generated after HR clearance.";
  saveState();
  showToast("Offer received. Accept or decline it from the progress dashboard.");
  render();
}

function decideOffer(applicationId, decision) {
  const application = state.applications.find((item) => item.id === applicationId);
  application.offerDecision = decision;
  application.status = decision === "accepted" ? "Offer Accepted" : "Offer Declined";
  application.notes = decision === "accepted"
    ? "Student accepted this offer."
    : "Student declined this offer.";
  saveState();
  showToast(`Offer ${decision}.`);
  render();
}

function submitQuiz(form) {
  const test = state.tests.find((item) => item.id === form.dataset.test);
  const data = new FormData(form);
  let correct = 0;
  test.questions.forEach((question, index) => {
    if (Number(data.get(`q${index}`)) === question.answer) correct += 1;
  });

  const score = Math.round((correct / test.questions.length) * 100);
  const passed = score >= test.passScore;
  const profile = student();

  state.mockResults[profile.id] = state.mockResults[profile.id] || {};
  state.mockResults[profile.id][test.type] = {
    score,
    passed,
    date: new Date().toISOString().slice(0, 10)
  };

  updateProgressFromTest(profile.id, test.type, passed);
  saveState();
  currentView = "tests";
  showToast(`${test.type} score: ${score}%. ${passed ? "Progress updated." : "Practice again to improve progress."}`);
  render();
}

function updateProgressFromTest(studentId, type, passed) {
  if (!passed) return;

  studentApplications(studentId).forEach((application) => {
    if (application.status !== "In Progress") return;

    if (type === "Aptitude" && ["Applied", "Aptitude"].includes(application.stage)) {
      application.stage = "Technical";
      application.notes = "Aptitude mock passed. Ready for technical validation.";
    }

    if (type === "Technical" && application.stage === "Technical") {
      application.stage = "HR";
      application.notes = "Technical mock passed. HR scheduling is unlocked.";
    }
  });
}

function teacherAdvance(applicationId) {
  const application = state.applications.find((item) => item.id === applicationId);
  if (!application || application.status !== "In Progress") return;
  const next = Math.min(stageIndex(application.stage) + 1, STAGES.length - 1);
  application.stage = STAGES[next];
  application.notes = `Placement cell advanced application to ${application.stage}.`;
  if (application.stage === "Offer") {
    application.status = "Offer Received";
    application.offerAmount = driveById(application.driveId).packageLpa;
  }
  saveState();
  showToast("Application advanced.");
  render();
}

function teacherOffer(applicationId) {
  const application = state.applications.find((item) => item.id === applicationId);
  if (!application) return;
  application.stage = "Offer";
  application.status = "Offer Received";
  application.offerAmount = driveById(application.driveId).packageLpa;
  application.notes = "Offer issued by placement cell.";
  saveState();
  showToast("Offer issued.");
  render();
}

function teacherReject(applicationId) {
  const application = state.applications.find((item) => item.id === applicationId);
  if (!application) return;
  application.status = "Rejected";
  application.notes = "Application marked rejected by placement cell.";
  saveState();
  showToast("Application rejected.");
  render();
}

document.querySelector(".tabbar").addEventListener("click", (event) => {
  const button = event.target.closest("[data-view]");
  if (!button) return;
  currentView = button.dataset.view;
  render();
});

document.querySelector("#resetDemoBtn").addEventListener("click", () => {
  state = clone(PPV_SEED);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  currentView = "profile";
  showToast("Demo data reset.");
  render();
});

document.addEventListener("change", (event) => {
  if (event.target.id === "studentSwitcher") {
    state.currentStudentId = event.target.value;
    saveState();
    render();
  }
});

document.addEventListener("submit", (event) => {
  if (event.target.id === "profileForm") {
    event.preventDefault();
    updateProfile(event.target, event.submitter?.dataset.action === "create");
  }

  if (event.target.id === "quizForm") {
    event.preventDefault();
    submitQuiz(event.target);
  }
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;
  if (action === "apply-drive") applyToDrive(id);
  if (action === "start-test") renderQuiz(id);
  if (action === "back-tests") renderTests();
  if (action === "schedule-hr") scheduleHr(id);
  if (action === "receive-offer") receiveOffer(id);
  if (action === "accept-offer") decideOffer(id, "accepted");
  if (action === "decline-offer") decideOffer(id, "declined");
  if (action === "teacher-advance") teacherAdvance(id);
  if (action === "teacher-offer") teacherOffer(id);
  if (action === "teacher-reject") teacherReject(id);
});

render();
