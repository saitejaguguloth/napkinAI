# 🎨 Napkin AI - Modern Website Builder

An AI-powered visual website builder that transforms sketches, voice commands, and text prompts into **stunning, production-ready websites** with real-time editing.

## ✨ What's New

### 🚀 **Premium Quality Generation**
- **Modern UI**: Vibrant colors, professional shadows, smooth animations
- **Fully Interactive**: All buttons, forms, and navigation work out of the box
- **Production-Ready**: Clean code, responsive design, accessibility built-in
- **No Placeholders**: Real content, no "Lorem ipsum"

👉 **See [GENERATION_QUALITY_GUIDE.md](./GENERATION_QUALITY_GUIDE.md) for details**

### 🎙️ **Real-Time Voice Editing**
- Speak naturally to edit your website
- See live transcription in the left panel
- Changes apply instantly to the preview

### 🎯 **Sandboxed Preview**
- Visual rendering (not raw HTML)
- All navigation stays in preview (no external redirects)
- Interactive elements work in preview

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI Models**: 
  - Google Gemini 2.5 Flash (vision & generation)
  - Groq Whisper (speech-to-text)
- **Authentication**: Firebase Auth
- **Database**: Firestore

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your API keys:
# - GEMINI_API_KEY
# - GROQ_API_KEY
# - Firebase config

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📚 Documentation

- **[GENERATION_QUALITY_GUIDE.md](./GENERATION_QUALITY_GUIDE.md)**: User guide for getting the best results
- **[GENERATION_IMPROVEMENTS.md](./GENERATION_IMPROVEMENTS.md)**: Technical details of recent improvements
- **[STUDIO_WORKFLOW.md](./STUDIO_WORKFLOW.md)**: Studio interface guide
- **[FIX_SUMMARY.md](./FIX_SUMMARY.md)**: Recent fixes and changes

## ✨ Features

### 🎨 Generation
- **Text to UI**: Describe your website, get modern HTML/React
- **Sketch to UI**: Upload hand-drawn sketches, get professional websites
- **Voice to UI**: Speak your ideas, see them come to life
- **Multi-Page**: Generate complete site structures

### 🎙️ Voice Editing
- Real-time speech-to-text transcription
- Natural language commands
- Immediate preview updates
- Works from the left panel

### 🔧 Studio Interface
- **Left Panel**: Voice/text editing with live transcription
- **Center Panel**: Live, interactive preview
- **Right Panel**: Code viewer with syntax highlighting
- **Bottom Panel**: Generation progress and status

### 🎯 Output Quality
- **Modern Design**: Vibrant colors, shadows, gradients
- **Interactive**: Buttons with hover effects, working forms
- **Responsive**: Mobile-first, looks great on all devices
- **Clean Code**: Semantic HTML, Tailwind CSS, vanilla JS

## 🎨 Design Philosophy

### Visual Excellence
- Modern, professional aesthetic
- Vibrant color palettes (blue, purple, emerald)
- Visual depth with shadows and gradients
- Generous whitespace and proper spacing
- Smooth transitions and animations

### Functionality First
- All buttons are clickable with effects
- Forms validate and provide feedback
- Navigation works and stays sandboxed
- Dropdowns, modals, and menus function properly

### Code Quality
- Semantic HTML5 structure
- Tailwind CSS for styling
- Vanilla JavaScript for interactivity
- Mobile-first responsive design
- Accessibility best practices

## 📖 Usage

### Creating from Text
```
Create a modern SaaS landing page with:
- Gradient hero section with CTA
- 3 feature cards with icons
- Pricing table with 3 tiers
- Newsletter signup form
```

### Creating from Sketch
1. Draw your layout (boxes, text, buttons)
2. Upload the image
3. Get a professional, interactive website

### Using Voice
1. Click microphone in left panel
2. Speak your command naturally
3. See live transcription
4. Changes apply instantly

### Editing
Use voice or text commands:
- "Make the hero background purple"
- "Add a contact form"
- "Change button color to green"
- "Make the text larger"

## 🏗️ Project Structure

```
app/
  ├── studio/          # Main editor interface
  ├── api/             # Generation endpoints
  └── ...
components/
  ├── studio/          # Studio UI components
  │   ├── ModifyChat.tsx      # Left panel with voice
  │   ├── PreviewEngine.tsx   # Center preview
  │   └── VoiceInput.tsx      # Voice transcription
  └── ...
lib/
  ├── prompt.ts        # Enhanced AI prompts
  ├── pipeline/        # Generation pipeline
  ├── generator/       # Code generators
  └── ...
```

## 🎯 Recent Improvements

### Generation Quality ⭐
- Enhanced prompts for modern, vibrant UI
- Auto-added interactivity (smooth scroll, ripple effects)
- Professional styling from the start
- No placeholder content

### Preview Rendering ⭐
- Fixed HTML wrapping and sandboxing
- Strengthened navigation blocking
- Visual rendering works perfectly
- All interactions stay in preview

### Voice Editing ⭐
- Real-time, streaming transcription
- Removed floating voice button
- Left panel only (ModifyChat)
- Immediate UI updates

## 🔧 Configuration

### Color Palettes
You can specify custom color schemes:
```javascript
{
  primary: '#3B82F6',    // Blue
  secondary: '#8B5CF6',  // Purple
  accent: '#10B981'      // Emerald
}
```

### Design Systems
- **Modern**: Clean, minimal, lots of whitespace
- **Bold**: Vibrant colors, large typography
- **Professional**: Corporate aesthetic
- **Playful**: Rounded corners, fun colors

### Tech Stacks
- HTML (single file, immediate preview)
- React (TSX with hooks)
- Next.js (App Router)
- Vue, Svelte (experimental)

## 🐛 Troubleshooting

### Preview shows raw HTML
- Should be fixed with latest updates
- Check PreviewEngine wrapping
- Look for console errors

### Buttons don't work
- Check JavaScript console
- Ensure preview fully loaded
- Try refresh

### Voice not working
- Check microphone permissions
- Verify GROQ_API_KEY is set
- Use left panel voice input only

## 🤝 Contributing

This is an evolving project. Areas for contribution:
- Additional design systems
- More interactive components
- Better mobile optimization
- Accessibility improvements
- Performance optimizations

## 📝 License

[Your License Here]

## 🙏 Credits

Built with:
- Next.js & React
- Tailwind CSS
- Google Gemini AI
- Groq Whisper
- Firebase

---

**Made with ❤️ for modern web builders**

For detailed usage and tips, see [GENERATION_QUALITY_GUIDE.md](./GENERATION_QUALITY_GUIDE.md)

