# Digital Maturity Assessment (DMSA)

> **A comprehensive self-assessment platform for SME digital transformation readiness**

[![Production](https://img.shields.io/badge/Status-Production%20Ready-green)](https://dmsa-5om77nc32-hassanzouhars-projects.vercel.app)
[![Framework](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-Storage%20%2B%20Firestore-orange)](https://firebase.google.com)

## 🚀 Quick Start

```bash
# Clone and install
git clone <repository-url>
cd dmsa
npm install

# Configure environment
cp .env.local.example .env.local
# Add your Firebase configuration

# Start development
npm run dev
```

## 📋 What is DMSA?

The Digital Maturity Assessment tool provides a standardized evaluation of digital transformation readiness across **6 key dimensions** through an **11-question comprehensive questionnaire**. Based on the official EU/JRC Digital Maturity Assessment framework.

**Live Application**: [dmsa-5om77nc32-hassanzouhars-projects.vercel.app](https://dmsa-5om77nc32-hassanzouhars-projects.vercel.app)

## ✅ Current Features

- ✅ **11-question assessment** covering 6 digital maturity dimensions
- ✅ **Multiple question types** (checkboxes, scales, tri-state)
- ✅ **Real-time scoring** with gap analysis
- ✅ **Interactive radar charts** and visualizations
- ✅ **Firebase data persistence** with unique survey IDs
- ✅ **Norwegian language support** with i18n framework
- ✅ **Responsive design** optimized for all devices
- ✅ **JSON export** and survey retrieval system

## 📚 Documentation

**For complete project documentation, see:**

### 🔗 [CONSOLIDATED_DOCUMENTATION.md](./CONSOLIDATED_DOCUMENTATION.md)

This comprehensive document contains:
- Complete technical specifications
- Assessment framework details
- Development guidelines
- API documentation
- Deployment instructions
- Future roadmap

### 📁 Archived Documentation

Previous documentation files have been moved to [`_arch/`](./_arch/) for reference.

## 🛠️ Tech Stack

- **Framework**: Next.js 15 + TypeScript
- **UI**: shadcn/ui + TailwindCSS
- **State**: Zustand
- **Charts**: Recharts
- **Backend**: Firebase (Storage + Firestore)
- **i18n**: react-i18next
- **Deploy**: Vercel

## 📈 Scoring System

- **Questions**: 0-10 scale with type-specific algorithms
- **Dimensions**: 0-100 scale across 6 categories
- **Overall**: 0-100 with maturity classification
- **Classifications**: Basic → Average → Moderately Advanced → Advanced

## 📞 Support

- **Maintainer**: Hassan Zouhar
- **Repository**: `/Users/haz/c0de/dmsa`
- **Issues**: See consolidated documentation for support channels

---

*For detailed technical information, implementation guides, and complete specifications, please refer to [CONSOLIDATED_DOCUMENTATION.md](./CONSOLIDATED_DOCUMENTATION.md)*