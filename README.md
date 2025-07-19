# 🌊 Smart Calendar Assistant

A revolutionary AI-powered calendar and schedule planning assistant with fluid time management interface.

## ✨ Features

### 🌊 TimeFlow Management
- **Fluid Animation Interface**: Events flow naturally like water with smooth animations
- **Drag & Drop**: Intuitive event rearrangement with visual feedback
- **Smart Zoom**: 10%-300% zoom range for precise time adjustments
- **Conflict Detection**: Automatic detection of time overlaps and energy conflicts
- **Quick Add**: Convenient event creation dialog
- **AI Suggestions**: Intelligent schedule optimization recommendations

### 🤖 AI Voice Assistant
- **Voice Interaction**: Natural voice input and audio feedback
- **Smart Conversations**: Powered by Coze API for natural language processing
- **Real-time Communication**: WebSocket-based real-time voice streaming
- **Multimodal Interaction**: Text + Voice dual interaction modes

### 📅 Traditional Calendar
- **Month View**: Classic monthly calendar display
- **Schedule Management**: Complete CRUD operations for events
- **Category Management**: Work, Meeting, Personal, Break classifications
- **Priority System**: High, Medium, Low priority levels

## 🚀 Tech Stack

### Frontend
- **Vue 3 + TypeScript**: Modern frontend framework
- **Pinia**: State management
- **Vue Router**: Routing management
- **Canvas API**: TimeFlow animation rendering

### AI Integration
- **Coze API**: Intelligent conversation and voice processing
- **WebSocket**: Real-time communication
- **Web Audio API**: Audio processing

## 📁 Project Structure

```
src/
├── components/          # Reusable components
│   ├── TimeFlowCanvas.vue
│   ├── VoiceInterface.vue
│   └── EnhancedVoiceInterface.vue
├── views/              # Page views
│   ├── TimeFlowView.vue
│   ├── CalendarView.vue
│   ├── ScheduleView.vue
│   └── AIAssistantView.vue
├── services/           # Business logic services
│   ├── timeFlow/       # TimeFlow engine
│   ├── audio/          # Audio services
│   └── ai/             # AI services
├── types/              # TypeScript type definitions
├── composables/        # Vue composables
└── config/             # Configuration files
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/wukeping2008/smartcalendar.git
   cd smartcalendar
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Coze API credentials
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

## 🎯 Usage

### TimeFlow Management
1. **Navigate to TimeFlow**: Click the "时间流" tab in the navigation
2. **Drag Events**: Click and drag event cards to reschedule
3. **Zoom Control**: Use the zoom slider for detailed time adjustments
4. **Quick Add**: Click the "+" button to add new events
5. **Apply Suggestions**: Use AI recommendations in the sidebar

### Voice Assistant
1. **Navigate to AI Assistant**: Click the "AI助手" tab
2. **Voice Input**: Click the microphone button and speak
3. **Text Chat**: Type messages for text-based interaction
4. **Schedule Commands**: Ask to "schedule a meeting" or "find free time"

### Traditional Calendar
1. **Month View**: Navigate using the calendar interface
2. **Create Events**: Click on dates to create new events
3. **Edit Events**: Click on existing events to modify
4. **Filter by Category**: Use category filters to organize view

## 🎨 Key Features Demo

### Fluid TimeFlow Interface
- Events appear as flowing cards that can be dragged smoothly
- Real-time conflict detection with visual indicators
- Zoom functionality for precise time management
- Animated transitions and ripple effects

### AI-Powered Suggestions
- Automatic detection of scheduling conflicts
- Energy-based optimization recommendations
- Intelligent break time suggestions
- Workload balancing advice

### Voice Interaction
- Natural language processing for schedule commands
- Voice feedback for confirmations
- Real-time audio streaming
- Multi-language support

## 🔧 Configuration

### Environment Variables
```env
VITE_COZE_API_KEY=your_coze_api_key
VITE_COZE_BOT_ID=your_bot_id
VITE_COZE_USER_ID=your_user_id
```

### TimeFlow Settings
```typescript
const config: TimeFlowConfig = {
  pixelsPerMinute: 2,
  flowSpeed: 1,
  maxVisibleHours: 12,
  animationDuration: 300,
  dragThreshold: 5,
  snapToGrid: true
}
```

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers (1200px+)
- Tablets (768px - 1199px)
- Mobile phones (320px - 767px)

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run linting
npm run lint
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Vue.js](https://vuejs.org/) - The Progressive JavaScript Framework
- [Coze API](https://www.coze.com/) - AI conversation platform
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) - For fluid animations
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) - For voice processing

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Contact: wukeping2008@gmail.com
- Documentation: [User Guide](docs/TIME_FLOW_USER_GUIDE.md)

## 🔮 Roadmap

- [ ] Calendar synchronization with Google Calendar
- [ ] Mobile app development
- [ ] Advanced AI scheduling algorithms
- [ ] Team collaboration features
- [ ] Integration with productivity tools
- [ ] Offline mode support

---

**Made with ❤️ by the Smart Calendar Team**
