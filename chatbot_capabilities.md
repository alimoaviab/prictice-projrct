# ERP Assistant - Chatbot Capabilities

The ERP Assistant is an advanced AI-powered copilot integrated into the Eduplexo school management system. It uses state-of-the-art Generative AI to help administrators, teachers, and staff manage school operations efficiently.

## 🚀 Core Technology
- **AI Engine**: Powered by **Google Gemini 3.1** (Flash-Lite and Pro).
- **Architecture**: Built with **LangChain** and **LangGraph** for sophisticated agentic reasoning and tool-calling.
- **Reliability**: Features automatic fallback to **Gemini 3.1 Pro** if the primary model is under high demand (503 error handling).

## 🛠️ Key Features & Access

### 1. Class & Enrollment Insights
The chatbot has full visibility into the school's structure:
- **List All Classes**: View all active classes across different academic years.
- **Class Details**: Fetch specific details for any class, including section, room number, and capacity.
- **Teacher Assignment**: Identify which teachers are assigned to which classes.
- **Enrollment Monitoring**: See how many students are enrolled in specific sections.

### 2. Student Information
- **Student Search**: Quickly find student records by name or ID.
- **Student Analysis**: Analyze student profiles to provide summaries or insights for staff.

### 3. Attendance Tracking
The assistant can help monitor student presence:
- **Fetch Records**: Retrieve attendance data for a specific date or class.
- **Identify Absences**: Quickly find out who was absent on a particular day.
- **Trend Analysis**: Help identify patterns in student attendance.

### 4. Guided ERP Operations
The chatbot acts as a live manual for the system:
- Provides step-by-step guidance on how to **Add Students**, **Manage Exams**, or **Generate Fee Records**.
- Suggests actionable next steps based on user queries.

## 💻 Technical Implementation Details
- **Location**: The main interface is in `components/ai/AIAssistant.tsx`.
- **API Layer**: Backend logic is handled in `app/api/ai/route.ts`.
- **Tool Registry**: Tools are defined in `shared/ai/tools/` (e.g., `class.tool.ts`, `attendance.tool.ts`).
- **Context Awareness**: The chatbot is aware of the current user's session and school context, ensuring data privacy and relevance.

## 💬 How to Use
Click the **Smart Toy (Robot)** icon in the top header of the application to open the assistant. You can ask natural questions like:
- *"Which classes have the most students?"*
- *"Show me the attendance for Class 10-A yesterday."*
- *"Who is the teacher for the Computer Science class?"*
- *"How do I add a new student to the system?"*
