# Mukono Diocese Voting System

A voting, leadership, and church management repository built for **Mukono Diocese (Uganda)** and designed to be reused by **any church**. It works best for Anglican structures and terminology, but it is flexible enough to support other denominations with configuration and customization. With additional customization, it can also serve as a church member system.

This project is an open-source contribution. If you would like to customize it for your church or add more features, please contact **slubambo57@gmail.com**.

## What This App Covers

- **Church structure management**: Diocese -> Archdeaconry -> Church -> Fellowship.
- **People registry**: Maintain a member database and search/filter records.
- **Leadership management**: Titles, positions, and leadership assignments.
- **Elections and voting**: Elections, positions, candidates, eligibility, voting codes, and ballots.
- **Results and tallying**: Tally runs, results certification, and reporting.
- **Role-based access**: Admin, DS (Diocesan Secretary), Bishop, Senior Staff, Polling Officer, and Voter.

## How It Works (End to End)

1. **Set up the church structure**  
   Configure dioceses, archdeaconries, churches, and fellowships. The app ships with a Mukono Diocese seed for quick start.

2. **Register people**  
   Add church members and maintain the people registry (names, contact info, status).

3. **Define leadership catalog**  
   Create position titles and positions used for leadership assignments and election roles.

4. **Create an election**  
   Define an election, add election positions, and open nomination or direct candidate entry.

5. **Build the voter roll & eligibility**  
   Assign eligible voters, generate voting codes, and map positions to the voting period.

6. **Voting flow**  
   - Voters log in with a **voting code**.  
   - If a phone number exists, the voter verifies the **last 3 digits**.  
   - The voter reviews the ballot, submits votes, and receives confirmation.

7. **Tally and publish results**  
   Admin runs the tally, reviews counts, certifies results, and finalizes winners.

## How to Use It

### 1) Requirements
- **Java 17**  
- **Node.js + npm**  
- **MariaDB** (or compatible MySQL setup)

### 2) Backend Setup (Spring Boot)
```bash
cd backend
./mvnw spring-boot:run
```

Backend defaults (development):
- Port: `8080`
- DB config: `backend/src/main/resources/application-dev.properties`
- Swagger UI: `http://localhost:8080/swagger-ui.html`

If you use a different database, update the JDBC settings in `backend/src/main/resources/application-dev.properties`.

### 3) Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

The frontend reads the API base URL from:
```bash
frontend/src/config/env.ts
```
You can also set `VITE_API_BASE_URL` in a local `.env` file.

### 4) Initial Admin User (Optional Helper)
If you need a quick admin account, see:
```
backend/project-assets/sql/test-users-setup.sql
```
This file includes a sample `admin` user and instructions.

### 5) Using the App (Admin / DS)
1. Log in at `/login`.
2. Configure church structure.
3. Create people records.
4. Define leadership positions and assignments.
5. Create elections, positions, candidates, and voting periods.
6. Generate eligibility and voting codes.
7. Run tallies and certify results.

### 6) Using the App (Voters)
1. Go to `/vote/login`.
2. Enter the voting code.
3. If prompted, verify the last 3 digits of your phone number.
4. Review the ballot and submit your vote.
5. View confirmation screen.

## Tech Stack

- **Backend**: Spring Boot 3, Java 17, MariaDB, JWT Security
- **Frontend**: React, TypeScript, Vite, MUI
- **Docs**: Swagger/OpenAPI (`/swagger-ui.html`)

## Customization Notes

- The org seed data is tailored for **Mukono Diocese**. You can edit or replace it in:
  `backend/src/main/java/com/mukono/voting/config/OrgSeeder.java`
- Roles are seeded automatically at startup in:
  `backend/src/main/java/com/mukono/voting/config/RoleSeeder.java`

## About This Project

This system was developed for **Mukono Diocese** (Anglican Church in Uganda) but can be used by other churches and denominations for elections and leadership management. It is shared as an open-source contribution to help churches run transparent, structured, and scalable voting processes.

If you want help customizing it for your church or adding more features, email:
**slubambo57@gmail.com**
