# AI Solution Maven — Brand Kit

## 1. Brand Identity
**Name:** AI Solution Maven  
**Tagline:** Building AI-powered solutions that solve real problems.  

**Positioning:**
- Practical AI builder
- Full-stack developer (web + mobile + AI)
- Product-focused freelancer

**Personality:**
- Intelligent
- Clear
- Modern
- Practical (no hype)

---

## 2. Color System

### Primary Colors
- Primary Blue: #2563EB
- Primary Purple: #7C3AED
- Dark Background: #0F172A
- Light Background: #F8FAFC

### Accent Colors
- Success: #10B981
- Warning: #F59E0B
- Error: #EF4444

### Gradient
linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)

### Neutral Colors
- Text Primary: #0F172A
- Text Secondary: #475569
- Border Light: #E2E8F0
- Border Dark: rgba(255,255,255,0.1)

---

## 3. Typography

**Primary Font:** Inter  
**Secondary Font (optional):** Space Grotesk  

### Headings
- H1: 48px / 700 / 1.2
- H2: 36px / 600 / 1.25
- H3: 28px / 600 / 1.3
- H4: 22px / 500 / 1.4

### Body
- Large: 18px
- Default: 16px
- Small: 14px

### Buttons
- Primary: 16px / 500
- Small: 14px / 500

---

## 4. Spacing (8pt Grid)
4px, 8px, 16px, 24px, 32px, 48px, 64px

---

## 5. UI Components

### Buttons
- Primary: Gradient background, white text, rounded-xl
- Secondary: Outline, light border

### Cards
- Radius: 16px
- Light shadow or dark translucent background

---

## 6. Layout
- Max width: 1200px
- Padding: 24px
- Hybrid dark/light sections

---

## 7. Iconography
- Library: Lucide React
- Style: Stroke icons
- Sizes: 16px, 20px, 24px

---

## 8. Imagery
- Use product screenshots and UI previews
- Avoid generic stock images

---

## 9. Voice & Tone
- Clear, direct, confident
- Focus on outcomes
- Avoid buzzwords

Example:
Good: "I build AI tools that help you make better decisions."
Bad: "Leveraging advanced AI paradigms..."

---

## 10. Branding Rules
- Maintain consistency in colors, fonts, spacing
- Avoid overdesign and random styles

---

## 11. Tailwind Config

```js
theme: {
  extend: {
    colors: {
      primary: "#2563EB",
      secondary: "#7C3AED",
      dark: "#0F172A",
      light: "#F8FAFC",
    },
    borderRadius: {
      xl: "12px",
      '2xl': "16px",
    }
  }
}
```

---

## 12. Product Alignment
All products (e.g., PlanSight AI) must follow the same design system to maintain brand consistency.
