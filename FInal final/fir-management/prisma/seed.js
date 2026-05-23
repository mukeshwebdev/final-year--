const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const hash = (p) => bcrypt.hash(p, 12);

const MOCK_AADHAAR_CITIZENS = [
  { aadhaarNumber: "123456789012", name: "Rajesh Kumar Singh", dob: new Date("1985-03-15"), address: "45, MG Road, New Delhi - 110001", phone: "9876543210", gender: "Male" },
  { aadhaarNumber: "234567890123", name: "Priya Sharma", dob: new Date("1992-07-22"), address: "12, Park Street, Mumbai - 400001", phone: "8765432109", gender: "Female" },
  { aadhaarNumber: "345678901234", name: "Mohammed Aslam Khan", dob: new Date("1978-11-08"), address: "78, Old City, Hyderabad - 500001", phone: "7654321098", gender: "Male" },
  { aadhaarNumber: "456789012345", name: "Sunita Devi", dob: new Date("1990-01-30"), address: "34, Gandhi Nagar, Jaipur - 302001", phone: "6543210987", gender: "Female" },
  { aadhaarNumber: "567890123456", name: "Vikram Patel", dob: new Date("1983-06-17"), address: "89, Ashram Road, Ahmedabad - 380001", phone: "9988776655", gender: "Male" },
  { aadhaarNumber: "678901234567", name: "Kavitha Reddy", dob: new Date("1995-09-04"), address: "23, Koramangala, Bangalore - 560034", phone: "8877665544", gender: "Female" },
  { aadhaarNumber: "789012345678", name: "Amit Tiwari", dob: new Date("1980-12-25"), address: "67, Civil Lines, Allahabad - 211001", phone: "7766554433", gender: "Male" },
  { aadhaarNumber: "890123456789", name: "Meena Kumari", dob: new Date("1988-04-11"), address: "11, Lake View, Kolkata - 700001", phone: "6655443322", gender: "Female" },
  { aadhaarNumber: "901234567890", name: "Suresh Babu", dob: new Date("1975-08-19"), address: "56, Anna Nagar, Chennai - 600040", phone: "9911223344", gender: "Male" },
  { aadhaarNumber: "012345678901", name: "Lakshmi Narayan", dob: new Date("1993-02-28"), address: "33, Indira Nagar, Lucknow - 226001", phone: "8800112233", gender: "Male" },
  { aadhaarNumber: "112233445566", name: "Deepa Menon", dob: new Date("1987-05-14"), address: "88, Kochi Fort, Kochi - 682001", phone: "7711223344", gender: "Female" },
  { aadhaarNumber: "223344556677", name: "Ravi Shankar Gupta", dob: new Date("1970-10-03"), address: "45, Freeganj, Ujjain - 456001", phone: "9900887766", gender: "Male" },
  { aadhaarNumber: "334455667788", name: "Anita Joshi", dob: new Date("1991-07-21"), address: "19, Model Colony, Pune - 411016", phone: "8811990077", gender: "Female" },
  { aadhaarNumber: "445566778899", name: "Imran Hussain", dob: new Date("1984-03-09"), address: "72, Charminar Area, Hyderabad - 500002", phone: "7722880099", gender: "Male" },
  { aadhaarNumber: "556677889900", name: "Geeta Sharma", dob: new Date("1996-11-16"), address: "5, Sector 17, Chandigarh - 160017", phone: "9933770088", gender: "Female" },
  { aadhaarNumber: "667788990011", name: "Prakash Yadav", dob: new Date("1979-06-07"), address: "38, Boring Road, Patna - 800001", phone: "8844660099", gender: "Male" },
  { aadhaarNumber: "778899001122", name: "Rekha Pillai", dob: new Date("1989-09-23"), address: "14, Trivandrum Road, Palakkad - 678001", phone: "7755550011", gender: "Female" },
  { aadhaarNumber: "889900112233", name: "Sanjay Mishra", dob: new Date("1982-01-14"), address: "61, Lanka, Varanasi - 221005", phone: "9966440022", gender: "Male" },
  { aadhaarNumber: "990011223344", name: "Padma Lakshmi Devi", dob: new Date("1994-08-30"), address: "27, Abids, Hyderabad - 500001", phone: "8877330033", gender: "Female" },
  { aadhaarNumber: "100112233445", name: "Arjun Singh Rawat", dob: new Date("1977-04-12"), address: "93, Rajpur Road, Dehradun - 248001", phone: "7788220044", gender: "Male" },
  { aadhaarNumber: "200223344556", name: "Fatima Bibi", dob: new Date("1992-12-05"), address: "18, Old Town, Bhopal - 462001", phone: "9911440055", gender: "Female" },
  { aadhaarNumber: "300334455667", name: "Rajiv Nair", dob: new Date("1986-07-18"), address: "42, Mattancherry, Kochi - 682002", phone: "8822550066", gender: "Male" },
  { aadhaarNumber: "400445566778", name: "Savita Patil", dob: new Date("1998-02-27"), address: "76, Hadapsar, Pune - 411028", phone: "7733660077", gender: "Female" },
  { aadhaarNumber: "500556677889", name: "Hemant Kumar Roy", dob: new Date("1973-10-01"), address: "53, Park Circus, Kolkata - 700017", phone: "9944770088", gender: "Male" },
  { aadhaarNumber: "600667788990", name: "Usha Rani", dob: new Date("1990-05-19"), address: "29, Ameerpet, Hyderabad - 500016", phone: "8855880099", gender: "Female" },
  { aadhaarNumber: "700778899001", name: "Naresh Choudhary", dob: new Date("1981-08-26"), address: "64, Sodala, Jaipur - 302019", phone: "7766990010", gender: "Male" },
  { aadhaarNumber: "800889900112", name: "Lalitha Kumari", dob: new Date("1995-01-08"), address: "37, Basavangudi, Bangalore - 560004", phone: "9977001122", gender: "Female" },
  { aadhaarNumber: "900990011223", name: "Dinesh Chandra", dob: new Date("1976-03-31"), address: "81, Hazratganj, Lucknow - 226001", phone: "8866112233", gender: "Male" },
  { aadhaarNumber: "101122334455", name: "Rukmini Devi", dob: new Date("1988-11-12"), address: "16, Adyar, Chennai - 600020", phone: "7711223344", gender: "Female" },
  { aadhaarNumber: "202233445566", name: "Manoj Kumar Verma", dob: new Date("1983-06-24"), address: "58, Taksal, Bhopal - 462002", phone: "9922334455", gender: "Male" },
  { aadhaarNumber: "303344556677", name: "Sneha Kapoor", dob: new Date("1997-09-07"), address: "22, Lajpat Nagar, New Delhi - 110024", phone: "8833445566", gender: "Female" },
  { aadhaarNumber: "404455667788", name: "Ashok Pandey", dob: new Date("1971-04-15"), address: "77, Sigra, Varanasi - 221010", phone: "7744556677", gender: "Male" },
  { aadhaarNumber: "505566778899", name: "Pooja Agarwal", dob: new Date("1993-12-20"), address: "41, Civil Lines, Nagpur - 440001", phone: "9955667788", gender: "Female" },
  { aadhaarNumber: "606677889900", name: "Santosh Kumar Sahu", dob: new Date("1980-07-03"), address: "85, Raipur Road, Bilaspur - 495001", phone: "8866778899", gender: "Male" },
  { aadhaarNumber: "707788990011", name: "Bhavna Desai", dob: new Date("1991-02-16"), address: "30, Navrangpura, Ahmedabad - 380009", phone: "7777889900", gender: "Female" },
  { aadhaarNumber: "808899001122", name: "Ramesh Chandra Dubey", dob: new Date("1974-10-28"), address: "69, Kidwai Nagar, Kanpur - 208011", phone: "9988990011", gender: "Male" },
  { aadhaarNumber: "909900112233", name: "Champa Devi", dob: new Date("1985-05-11"), address: "13, Dharampeth, Nagpur - 440010", phone: "8899001122", gender: "Female" },
  { aadhaarNumber: "010011223344", name: "Yogesh Tripathi", dob: new Date("1978-08-04"), address: "47, Alambagh, Lucknow - 226005", phone: "7700112233", gender: "Male" },
  { aadhaarNumber: "111213141516", name: "Mamta Singh", dob: new Date("1994-01-22"), address: "36, Boring Canal Road, Patna - 800001", phone: "9811223344", gender: "Female" },
  { aadhaarNumber: "212223242526", name: "Vinod Kumar Jha", dob: new Date("1969-06-09"), address: "74, Ranchi Road, Dhanbad - 826001", phone: "8722334455", gender: "Male" },
  { aadhaarNumber: "313233343536", name: "Saroja Devi", dob: new Date("1987-11-25"), address: "28, Annanagar, Madurai - 625020", phone: "7633445566", gender: "Female" },
  { aadhaarNumber: "414243444546", name: "Nilesh Deshmukh", dob: new Date("1982-04-07"), address: "63, Karve Road, Pune - 411004", phone: "9544556677", gender: "Male" },
  { aadhaarNumber: "515253545556", name: "Radha Krishnan", dob: new Date("1996-09-18"), address: "21, Triveni Nagar, Allahabad - 211016", phone: "8455667788", gender: "Male" },
  { aadhaarNumber: "616263646566", name: "Seema Rani", dob: new Date("1979-02-05"), address: "59, Kakadeo, Kanpur - 208025", phone: "7366778899", gender: "Female" },
  { aadhaarNumber: "717273747576", name: "Durga Prasad", dob: new Date("1972-07-17"), address: "83, Crossing, Meerut - 250001", phone: "9277889900", gender: "Male" },
  { aadhaarNumber: "818283848586", name: "Hema Latha", dob: new Date("1990-12-01"), address: "15, Himayatnagar, Hyderabad - 500029", phone: "8188990011", gender: "Female" },
  { aadhaarNumber: "919293949596", name: "Rakesh Chaudhary", dob: new Date("1985-05-24"), address: "43, Bhowanipore, Kolkata - 700025", phone: "7099001122", gender: "Male" },
  { aadhaarNumber: "020304050607", name: "Nandita Roy", dob: new Date("1993-10-09"), address: "87, Salt Lake, Kolkata - 700091", phone: "9000112233", gender: "Female" },
  { aadhaarNumber: "121314151617", name: "Sunil Kumar Aggarwal", dob: new Date("1977-03-20"), address: "31, Subhash Nagar, New Delhi - 110027", phone: "8011223344", gender: "Male" },
  { aadhaarNumber: "999888777666", name: "Mahesh Babu Goswami", dob: new Date("1975-07-14"), address: "12, Banjara Hills, Hyderabad - 500034", phone: "9900001111", gender: "Male" },
];

async function main() {
  console.log("Starting seed...");

  await prisma.auditLog.deleteMany();
  await prisma.watchlist.deleteMany();
  await prisma.chargesheet.deleteMany();
  await prisma.courtHearing.deleteMany();
  await prisma.investigationLog.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.fIR.deleteMany();
  await prisma.complainant.deleteMany();
  await prisma.accused.deleteMany();
  await prisma.user.deleteMany();
  await prisma.mockAadhaarCitizen.deleteMany();

  console.log("Seeding mock Aadhaar citizens...");
  for (const citizen of MOCK_AADHAAR_CITIZENS) {
    await prisma.mockAadhaarCitizen.create({ data: citizen });
  }

  console.log("Seeding users...");
  const [admin, inspector, si, writer1, writer2, citizen] = await Promise.all([
    prisma.user.create({ data: { name: "Admin Superuser", email: "admin@fir.gov", password: await hash("Admin@123"), role: "SUPER_ADMIN", badgeNumber: "SA-001" } }),
    prisma.user.create({ data: { name: "Inspector Rajesh Kumar", email: "inspector@fir.gov", password: await hash("Inspect@123"), role: "INSPECTOR", badgeNumber: "INS-101" } }),
    prisma.user.create({ data: { name: "SI Priya Sharma", email: "si@fir.gov", password: await hash("SI@12345"), role: "SI", badgeNumber: "SI-201" } }),
    prisma.user.create({ data: { name: "Writer Amit Verma", email: "writer1@fir.gov", password: await hash("Writer@123"), role: "WRITER", badgeNumber: "WR-301" } }),
    prisma.user.create({ data: { name: "Writer Sunita Patel", email: "writer2@fir.gov", password: await hash("Writer@456"), role: "WRITER", badgeNumber: "WR-302" } }),
    prisma.user.create({ data: { name: "Ramesh Citizen", email: "citizen@fir.gov", password: await hash("Citizen@123"), role: "CITIZEN" } }),
  ]);

  console.log("Seeding accused and complainants...");

  const accusedData = [
    { name: "Ramesh Sharma", address: "45 Old City, Delhi", aadhaarNumber: "999888777666", isRepeatOffender: true, isWatchlisted: true },
    { name: "Suresh Kumar", address: "Near Station, Mumbai", aadhaarNumber: "878685848382", isRepeatOffender: true },
    { name: "Mahesh Yadav", address: "Unknown", isRepeatOffender: false },
    { name: "Unknown Accused", address: "Unknown", isRepeatOffender: false },
    { name: "Ganesh Mistry", address: "77, Andheri West, Mumbai", isRepeatOffender: false },
  ];

  const accusedList = [];
  for (const a of accusedData) {
    accusedList.push(await prisma.accused.create({ data: a }));
  }

  const watchlistEntries = [
    { accusedId: accusedList[0].id, reason: "Repeat offender with multiple theft cases. Known criminal.", addedById: inspector.id },
    { accusedId: accusedList[1].id, reason: "Suspect in multiple assault cases in the area.", addedById: inspector.id },
  ];
  for (const w of watchlistEntries) {
    await prisma.watchlist.create({ data: w });
  }

  const firSamples = [
    { crimeType: "Theft", location: "Connaught Place, New Delhi", desc: "Complainant's wallet and mobile phone were stolen by an unknown person while travelling in a crowded metro station. The accused snatched the bag and fled before anyone could react.", urgency: "MEDIUM", status: "FILED", accusedIdx: 3 },
    { crimeType: "Assault", location: "MG Road, Bangalore", desc: "Complainant was physically assaulted by the accused near a shopping mall. The accused beat the victim with his fists causing injuries to the face and arms. Witnesses were present.", urgency: "HIGH", status: "UNDER_INVESTIGATION", accusedIdx: 2 },
    { crimeType: "Cybercrime", location: "Online / Hyderabad", desc: "Complainant received a phishing email from an unknown sender impersonating a bank. Clicked on a link and lost Rs 50,000 from their bank account through fraudulent transactions.", urgency: "HIGH", status: "UNDER_INVESTIGATION", accusedIdx: 3 },
    { crimeType: "Domestic Violence", location: "Sector 15, Chandigarh", desc: "Complainant's wife reported severe domestic violence by her husband who was in a state of intoxication. Children were also present during the incident.", urgency: "CRITICAL", status: "UNDER_INVESTIGATION", accusedIdx: 2 },
    { crimeType: "Robbery", location: "Linking Road, Mumbai", desc: "Armed robbery at a jewelry shop. Two masked men entered the shop, threatened the owner and staff with knives, and fled with gold ornaments worth Rs 15 lakhs.", urgency: "CRITICAL", status: "COURT", accusedIdx: 0 },
    { crimeType: "Fraud", location: "Connaught Place, New Delhi", desc: "Complainant was cheated of Rs 2 lakhs by a person posing as a real estate agent. The accused took advance payment for a flat that did not exist.", urgency: "HIGH", status: "CHARGESHEET_GENERATED", accusedIdx: 1 },
    { crimeType: "Theft", location: "Brigade Road, Bangalore", desc: "Vehicle theft reported. Complainant parked their two-wheeler in a designated parking spot. On return, found the vehicle missing. No CCTV footage available.", urgency: "LOW", status: "FILED", accusedIdx: 3 },
    { crimeType: "Harassment", location: "Anna Nagar, Chennai", desc: "Complainant being repeatedly harassed and stalked by her ex-colleague. The accused has been sending threatening messages and following her to her workplace.", urgency: "HIGH", status: "UNDER_INVESTIGATION", accusedIdx: 4 },
    { crimeType: "Drug Offense", location: "Nehru Place, New Delhi", desc: "Accused was found in possession of 500 grams of marijuana during a routine vehicle check. The accused was transporting the contraband in a hidden compartment.", urgency: "HIGH", status: "COURT", accusedIdx: 2 },
    { crimeType: "Vandalism", location: "Old Market, Pune", desc: "Complainant's property and business signboard were deliberately damaged and spray-painted with offensive graffiti during nighttime. Security cameras captured partial footage.", urgency: "LOW", status: "FILED", accusedIdx: 3 },
    { crimeType: "Kidnapping", location: "Sector 22, Noida", desc: "A 7-year-old child was reported missing by parents. According to witnesses, the child was last seen being picked up by an unknown man in a white sedan near the school.", urgency: "CRITICAL", status: "UNDER_INVESTIGATION", accusedIdx: 3 },
    { crimeType: "Extortion", location: "Banjara Hills, Hyderabad", desc: "Complainant, a businessman, receiving threatening calls demanding Rs 10 lakhs as protection money. The caller threatened to harm his family if demands were not met.", urgency: "CRITICAL", status: "UNDER_INVESTIGATION", accusedIdx: 1 },
    { crimeType: "Theft", location: "Lal Darwaza, Ahmedabad", desc: "Gold jewelry worth Rs 3 lakhs stolen from the house during the night. The accused entered through a back window while the family was asleep.", urgency: "HIGH", status: "CLOSED", accusedIdx: 0 },
    { crimeType: "Assault", location: "FC Road, Pune", desc: "Group fight outside a restaurant at night. Complainant was assaulted by a group of 4 men. Suffered fracture in the right arm and multiple bruises.", urgency: "HIGH", status: "COURT", accusedIdx: 2 },
    { crimeType: "Fraud", location: "Salt Lake, Kolkata", desc: "Online investment fraud. Complainant was lured into investing Rs 5 lakhs in a fake cryptocurrency scheme. The accused is now unreachable and has blocked all communication.", urgency: "MEDIUM", status: "UNDER_INVESTIGATION", accusedIdx: 4 },
    { crimeType: "Cybercrime", location: "Whitefield, Bangalore", desc: "Company database was hacked and sensitive customer data was stolen. The attackers demanded ransom of 2 Bitcoin to prevent data leak.", urgency: "CRITICAL", status: "UNDER_INVESTIGATION", accusedIdx: 3 },
    { crimeType: "Murder", location: "Saket, New Delhi", desc: "Body of a 35-year-old male found in a park. Multiple stab wounds on the body. Initial investigation suggests premeditated murder. Victim identified through Aadhaar card.", urgency: "CRITICAL", status: "CHARGESHEET_GENERATED", accusedIdx: 1 },
    { crimeType: "Robbery", location: "Vijay Nagar, Indore", desc: "Snatching incident at a busy intersection. Accused on motorcycle snatched the complainant's gold chain and purse while she was walking. Vehicle registration noted by witness.", urgency: "HIGH", status: "FILED", accusedIdx: 2 },
    { crimeType: "Harassment", location: "Gomti Nagar, Lucknow", desc: "Female employee at a private company reporting sexual harassment by her senior manager. Multiple incidents over the past three months. Screenshots of offensive messages provided.", urgency: "HIGH", status: "UNDER_INVESTIGATION", accusedIdx: 4 },
    { crimeType: "Drug Offense", location: "Sadar Bazar, Delhi", desc: "Raid on a suspected drug distribution network. Three individuals arrested with 2 kg of heroin. Accused claims the drugs belong to a larger syndicate.", urgency: "CRITICAL", status: "COURT", accusedIdx: 0 },
  ];

  const complainants = [
    { name: "Mohan Lal", address: "12 Shastri Nagar, Delhi", phone: "9876512345" },
    { name: "Radha Devi", address: "34 MG Road, Bangalore", phone: "8765423456" },
    { name: "Tejinder Singh", address: "Hitech City, Hyderabad", phone: "7654334567" },
    { name: "Malathi Krishnan", address: "Sector 15, Chandigarh", phone: "6543245678" },
    { name: "Raju Mehta", address: "Colaba, Mumbai", phone: "9988556677" },
    { name: "Vinita Jain", address: "CP, New Delhi", phone: "8877445566" },
    { name: "Rohit Sharma", address: "Koramangala, Bangalore", phone: "7766334455" },
    { name: "Sonal Gupta", address: "Anna Nagar, Chennai", phone: "6655223344" },
    { name: "Kapil Dev", address: "Nehru Place, Delhi", phone: "9944112233" },
    { name: "Rashida Begum", address: "Old Market, Pune", phone: "8833001122" },
    { name: "Suresh Nair", address: "Sector 22, Noida", phone: "7722990011" },
    { name: "Vikram Malhotra", address: "Banjara Hills, Hyd", phone: "9911880000" },
    { name: "Geeta Pillai", address: "Lal Darwaza, Ahmedabad", phone: "8800779999" },
    { name: "Anil Kapoor", address: "FC Road, Pune", phone: "7799668888" },
    { name: "Deepak Roy", address: "Salt Lake, Kolkata", phone: "9988557777" },
    { name: "Pradeep Kumar", address: "Whitefield, Bangalore", phone: "8877446666" },
    { name: "Neeta Agarwal", address: "Saket, Delhi", phone: "7766335555" },
    { name: "Harish Chandra", address: "Vijay Nagar, Indore", phone: "6655224444" },
    { name: "Anjali Singh", address: "Gomti Nagar, Lucknow", phone: "9944113333" },
    { name: "Dilip Kumar", address: "Sadar Bazar, Delhi", phone: "8833002222" },
  ];

  console.log("Seeding FIRs...");
  const filedAt = [inspector, writer1, writer2, writer1, inspector, writer2, writer1, writer2, inspector, writer1];

  for (let i = 0; i < firSamples.length; i++) {
    const sample = firSamples[i];
    const compData = complainants[i];
    const comp = await prisma.complainant.create({ data: compData });
    const year = 2024;
    const seq = String(i + 1).padStart(4, "0");

    const createdAt = new Date(Date.now() - (firSamples.length - i) * 3 * 24 * 60 * 60 * 1000);

    const fir = await prisma.fIR.create({
      data: {
        firNumber: `FIR/${year}/${seq}`,
        complainantId: comp.id,
        accusedId: sample.accusedIdx < accusedList.length ? accusedList[sample.accusedIdx].id : null,
        incidentDate: new Date(createdAt.getTime() - 24 * 60 * 60 * 1000),
        incidentTime: `${10 + (i % 12)}:${(i * 7 % 60).toString().padStart(2, "0")}`,
        incidentLocation: sample.location,
        description: sample.desc,
        crimeType: sample.crimeType,
        urgency: sample.urgency,
        status: sample.status,
        filedById: filedAt[i % filedAt.length].id,
        assignedToId: ["UNDER_INVESTIGATION", "COURT", "CHARGESHEET_GENERATED", "CLOSED"].includes(sample.status) ? (i % 2 === 0 ? si.id : inspector.id) : null,
        editHistory: [{ action: "CREATED", by: filedAt[i % filedAt.length].id, at: createdAt.toISOString() }],
      },
    });

    if (["UNDER_INVESTIGATION", "COURT", "CLOSED"].includes(sample.status)) {
      await prisma.investigationLog.create({
        data: {
          firId: fir.id,
          note: `Initial investigation commenced. Scene visited and witnesses interviewed. Evidence collected for forensic analysis.`,
          addedById: si.id,
        },
      });
    }

    if (["COURT", "CLOSED"].includes(sample.status)) {
      await prisma.courtHearing.create({
        data: {
          firId: fir.id,
          hearingDate: new Date(Date.now() + (i % 3 === 0 ? -7 : 7) * 24 * 60 * 60 * 1000),
          courtName: `District Sessions Court, ${sample.location.split(",").pop().trim()}`,
          judge: `Justice ${["R.K. Sharma", "S.P. Singh", "M. Verma", "A. Kumar", "P. Gupta"][i % 5]}`,
          order: "Case admitted. Next date scheduled.",
          outcome: i % 3 === 0 ? "Bail hearing pending" : "Under trial",
        },
      });
    }
  }

  console.log("Seed completed successfully!");
  console.log("\n--- Login Credentials ---");
  console.log("Super Admin:  admin@fir.gov     / Admin@123");
  console.log("Inspector:    inspector@fir.gov / Inspect@123");
  console.log("SI:           si@fir.gov        / SI@12345");
  console.log("Writer 1:     writer1@fir.gov   / Writer@123");
  console.log("Writer 2:     writer2@fir.gov   / Writer@456");
  console.log("Citizen:      citizen@fir.gov   / Citizen@123");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
