# 🚀 Smart Calendar System v4.0

An AI-powered intelligent time management platform with multiple AI model integration, real-time data awareness, and smart decision-making capabilities.

[![Next.js](https://img.shields.io/badge/Next.js-15.4-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![AI Enhanced](https://img.shields.io/badge/AI-Enhanced-purple)](https://github.com/yourusername/smartcalendar)

[中文版](./README.md) | English Version

## ✨ Core Features

### 🧠 AI Intelligence Core
- **Multi-AI Model Integration** - Claude, OpenAI GPT and more models working together
- **Smart Decision Engine** - Multi-dimensional analysis (Productivity, Energy, AI Enhancement)
- **Natural Language Understanding** - Natural language support for creating and managing schedules
- **Intelligent Recommendation System** - Personalized suggestions based on user habits and data analysis

### 📅 Schedule Management
- **Multi-View Switching** - Flexible switching between Day, Week, and Month views
- **Smart Conflict Detection** - Automatic identification and resolution of schedule conflicts
- **Cognitive Bandwidth Management** - Task load management based on cognitive science
- **Time Budget System** - Precise time allocation and tracking

### 🎯 Professional Features
- **GTD Task Management** - Complete Getting Things Done workflow
- **Project Management** - Multi-project parallel management and progress tracking
- **SOP Executor** - Standard operating procedure automation
- **What-If Simulator** - Scenario simulation and decision support

### 🎤 Interactive Experience
- **Voice Input** - Voice interaction powered by Azure Speech Service
- **3D Time Flow** - Three.js-driven 3D time visualization
- **Floating Panel System** - Flexible multi-panel workspace
- **Responsive Design** - Perfect adaptation for desktop and mobile devices

## 🚀 Quick Start

### Requirements
- Node.js 18.0 or higher
- npm or yarn package manager
- Modern browser (Chrome, Firefox, Safari, Edge)

### Installation Steps

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/smartcalendar.git
cd smartcalendar
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create `.env.local` file:
```env
# AI Service Configuration (Optional)
ANTHROPIC_API_KEY=your_claude_api_key
OPENAI_API_KEY=your_openai_api_key

# Voice Service Configuration (Optional)
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=your_region
```

4. **Start development server**
```bash
npm run dev
```

5. **Access the application**
Open your browser and visit [http://localhost:3000](http://localhost:3000)

## 📖 User Guide

### Basic Operations
1. **Create Events** - Click "New Event" button or use voice input
2. **Switch Views** - Use top navigation bar to switch between Day/Week/Month views
3. **Manage Tasks** - Manage to-dos through GTD panel
4. **View Analytics** - Access cognitive bandwidth monitoring panel to check load status

### Advanced Features
- **Floating Panels** - Click icons on the right sidebar to open various function panels
- **AI Assistant** - Use AI assistant for intelligent suggestions
- **Project Management** - Create and manage multiple projects
- **Time Budget** - Set and track time budgets

## 🏗️ Technical Architecture

### Tech Stack
- **Frontend Framework**: Next.js 15.4 + React 19
- **Type System**: TypeScript 5.0
- **Styling**: Tailwind CSS + Radix UI
- **State Management**: Zustand
- **3D Rendering**: Three.js + React Three Fiber
- **Data Persistence**: IndexedDB

### Project Structure
```
smartcalendar/
├── src/
│   ├── app/              # Next.js app routes
│   └── components/       # UI components
├── components/           # Feature components
│   ├── ai/              # AI-related components
│   ├── calendar/        # Calendar components
│   ├── cognitive/       # Cognitive management
│   ├── gtd/            # GTD task management
│   └── ...             # Other feature components
├── lib/                 # Core libraries
│   ├── services/        # Service layer
│   ├── stores/          # State stores
│   └── engines/         # Business engines
├── types/               # TypeScript type definitions
└── docs/                # Project documentation
```

## 🔧 Development Guide

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build production version
npm run start        # Start production server
npm run lint         # Code linting
```

### Code Standards
- Use TypeScript for type-safe development
- Follow ESLint configuration for code standards
- Use functional components and Hooks
- Style with Tailwind CSS

## 📝 Changelog

See [DEVELOPMENT_PROGRESS.md](./DEVELOPMENT_PROGRESS.md) for detailed development progress and update history.

## 🤝 Contributing

Issues and Pull Requests are welcome. Before submitting, please ensure:

1. Code passes lint checks
2. Add necessary type definitions
3. Update relevant documentation
4. Test functionality works properly

## 📄 License

MIT License

## 🙏 Acknowledgments

Thanks to all developers and users who have contributed to this project.

---

**Project Maintainer**: [Your Name]  
**Last Updated**: 2025-01-17  
**Version**: v4.0 Stable