const PPV_SEED = {
  currentStudentId: "STU1001",
  students: [
    {
      id: "STU1001",
      name: "Demo Student 1",
      email: "student1@example.com",
      phone: "0000000000",
      enrollment: "DEMO-CSE-001",
      branch: "CSE",
      year: "4th Year",
      cgpa: 8.3,
      backlogs: 0,
      projects: 3,
      skills: "Java, Python, SQL, DSA, React",
      resumeName: "demo_resume_1.pdf"
    },
    {
      id: "STU1002",
      name: "Demo Student 2",
      email: "student2@example.com",
      phone: "0000000000",
      enrollment: "DEMO-IT-002",
      branch: "IT",
      year: "4th Year",
      cgpa: 7.4,
      backlogs: 1,
      projects: 2,
      skills: "Java, SQL, HTML, CSS",
      resumeName: "demo_resume_2.pdf"
    },
    {
      id: "STU1003",
      name: "Demo Student 3",
      email: "student3@example.com",
      phone: "0000000000",
      enrollment: "DEMO-ECE-003",
      branch: "ECE",
      year: "4th Year",
      cgpa: 6.8,
      backlogs: 0,
      projects: 1,
      skills: "C, Embedded Systems, Networking",
      resumeName: ""
    },
    {
      id: "STU1004",
      name: "Demo Student 4",
      email: "student4@example.com",
      phone: "0000000000",
      enrollment: "DEMO-CSE-004",
      branch: "CSE",
      year: "4th Year",
      cgpa: 9.1,
      backlogs: 0,
      projects: 4,
      skills: "JavaScript, React, Node, MongoDB, DSA",
      resumeName: "demo_resume_4.pdf"
    },
    {
      id: "STU1005",
      name: "Demo Student 5",
      email: "student5@example.com",
      phone: "0000000000",
      enrollment: "DEMO-ME-005",
      branch: "ME",
      year: "4th Year",
      cgpa: 7.7,
      backlogs: 0,
      projects: 2,
      skills: "AutoCAD, SolidWorks, Production, Excel",
      resumeName: "demo_resume_5.pdf"
    }
  ],
  drives: [
    {
      id: "DRV101",
      company: "Infosys",
      role: "Systems Engineer",
      packageLpa: 3.6,
      visitDate: "2026-10-14",
      minCgpa: 6.0,
      maxBacklogs: 1,
      branches: ["CSE", "IT", "ECE", "ME"],
      years: ["4th Year"],
      requiredSkills: ["SQL", "Java"],
      minProjects: 1,
      seats: 40,
      resumeRequired: true
    },
    {
      id: "DRV102",
      company: "TCS Digital",
      role: "Software Developer",
      packageLpa: 7.0,
      visitDate: "2026-10-18",
      minCgpa: 7.0,
      maxBacklogs: 0,
      branches: ["CSE", "IT", "ECE"],
      years: ["4th Year"],
      requiredSkills: ["DSA", "Java"],
      minProjects: 2,
      seats: 25,
      resumeRequired: true
    },
    {
      id: "DRV103",
      company: "Microsoft",
      role: "SDE Intern + PPO",
      packageLpa: 32.0,
      visitDate: "2026-10-22",
      minCgpa: 8.5,
      maxBacklogs: 0,
      branches: ["CSE", "IT"],
      years: ["3rd Year", "4th Year"],
      requiredSkills: ["DSA", "JavaScript", "React"],
      minProjects: 3,
      seats: 8,
      resumeRequired: true
    },
    {
      id: "DRV104",
      company: "Larsen and Toubro",
      role: "Graduate Engineer Trainee",
      packageLpa: 5.5,
      visitDate: "2026-10-25",
      minCgpa: 6.5,
      maxBacklogs: 0,
      branches: ["ECE", "ME"],
      years: ["4th Year"],
      requiredSkills: ["Excel", "Production"],
      minProjects: 1,
      seats: 18,
      resumeRequired: true
    },
    {
      id: "DRV105",
      company: "Zoho",
      role: "Member Technical Staff",
      packageLpa: 8.0,
      visitDate: "2026-10-29",
      minCgpa: 7.5,
      maxBacklogs: 0,
      branches: ["CSE", "IT", "ECE"],
      years: ["4th Year"],
      requiredSkills: ["DSA", "SQL", "JavaScript"],
      minProjects: 2,
      seats: 15,
      resumeRequired: true
    }
  ],
  applications: [
    {
      id: "APP1001",
      studentId: "STU1001",
      driveId: "DRV101",
      stage: "Offer",
      status: "Offer Received",
      hrSlot: "2026-10-16T10:00",
      offerDecision: "",
      offerAmount: 3.6,
      notes: "Selected after HR discussion."
    },
    {
      id: "APP1002",
      studentId: "STU1001",
      driveId: "DRV102",
      stage: "Technical",
      status: "In Progress",
      hrSlot: "",
      offerDecision: "",
      offerAmount: 0,
      notes: "Technical round pending."
    },
    {
      id: "APP1003",
      studentId: "STU1002",
      driveId: "DRV101",
      stage: "Aptitude",
      status: "In Progress",
      hrSlot: "",
      offerDecision: "",
      offerAmount: 0,
      notes: "Aptitude score review needed."
    },
    {
      id: "APP1004",
      studentId: "STU1004",
      driveId: "DRV103",
      stage: "HR",
      status: "In Progress",
      hrSlot: "2026-10-23T14:30",
      offerDecision: "",
      offerAmount: 0,
      notes: "HR discussion scheduled."
    },
    {
      id: "APP1005",
      studentId: "STU1005",
      driveId: "DRV104",
      stage: "Applied",
      status: "In Progress",
      hrSlot: "",
      offerDecision: "",
      offerAmount: 0,
      notes: "Application submitted."
    }
  ],
  mockResults: {
    STU1001: {
      Aptitude: { score: 80, passed: true, date: "2026-10-10" },
      Technical: { score: 70, passed: true, date: "2026-10-12" }
    }
  },
  tests: [
    {
      id: "aptitude-basic",
      type: "Aptitude",
      title: "Aptitude Readiness Test",
      passScore: 60,
      questions: [
        {
          text: "A train travels 180 km in 3 hours. What is its speed?",
          options: ["45 km/h", "50 km/h", "60 km/h", "75 km/h"],
          answer: 2
        },
        {
          text: "If 20% of a number is 50, what is the number?",
          options: ["100", "150", "200", "250"],
          answer: 3
        },
        {
          text: "Find the next number: 3, 6, 12, 24, __.",
          options: ["30", "36", "42", "48"],
          answer: 3
        },
        {
          text: "A shopkeeper gives 10% discount on Rs 500. What is the selling price?",
          options: ["Rs 400", "Rs 425", "Rs 450", "Rs 475"],
          answer: 2
        },
        {
          text: "Which word means the same as 'brief'?",
          options: ["Short", "Heavy", "Late", "Wide"],
          answer: 0
        }
      ]
    },
    {
      id: "technical-basic",
      type: "Technical",
      title: "Technical Interview Practice Test",
      passScore: 60,
      questions: [
        {
          text: "Which data structure uses FIFO order?",
          options: ["Stack", "Queue", "Tree", "Graph"],
          answer: 1
        },
        {
          text: "What does SQL stand for?",
          options: ["Simple Query List", "Structured Query Language", "System Queue Logic", "Sorted Query Line"],
          answer: 1
        },
        {
          text: "Which HTTP method is normally used to create data?",
          options: ["GET", "POST", "TRACE", "HEAD"],
          answer: 1
        },
        {
          text: "In JavaScript, which keyword declares a block-scoped variable?",
          options: ["var", "let", "global", "static"],
          answer: 1
        },
        {
          text: "What is the average time complexity of binary search on a sorted array?",
          options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
          answer: 1
        }
      ]
    }
  ]
};
