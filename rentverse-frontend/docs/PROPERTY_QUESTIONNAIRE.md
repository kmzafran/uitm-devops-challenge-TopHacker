# Property Listing Questionnaire System

This system provides a comprehensive step-by-step questionnaire interface for creating property listings with progress tracking, state management, and temporary data persistence.

## Features

### 🎯 Core Features
- **Step-by-step navigation** with progress tracking
- **Visual progress bar** showing completion status
- **State management** with Zustand for form data
- **Local storage persistence** for temporary data
- **Exit functionality** with data clearing option
- **Validation** for each step before progression
- **Responsive design** with mobile support

### 📊 Progress Tracking
- **Visual progress tracker** sidebar (desktop)
- **Step completion indicators** with checkmarks
- **Locked steps** until prerequisites are met
- **Direct navigation** to accessible steps
- **Overall progress percentage**

### 💾 Data Management
- **Automatic save** to localStorage as user progresses
- **Form validation** before allowing step progression
- **Clean exit** with confirmation for unsaved changes
- **Data persistence** across browser sessions
- **API submission** on completion

## Architecture

### 🗂️ File Structure
```
stores/
  └── propertyListingStore.ts     # Main state management
components/
  ├── ProgressTracker.tsx         # Progress sidebar component
  ├── EnhancedQuestionnaireWrapper.tsx  # Layout wrapper
  └── NavbarStepperBottom.tsx     # Bottom navigation bar
app/
  ├── property/new/page.tsx       # Main questionnaire page
  └── property/success/page.tsx   # Success page after submission
views/
  ├── AddListingFirst.tsx         # Introduction step
  ├── AddListingStepOnePlace.tsx  # Property type selection
  └── ... (other step components)
```

### 🏗️ Components Overview

#### PropertyListingStore
- **Purpose**: Centralized state management for all form data
- **Features**: 
  - Form data persistence with localStorage
  - Step navigation logic
  - Validation rules for each step
  - API submission handling

#### ProgressTracker
- **Purpose**: Visual progress tracking sidebar
- **Features**:
  - Shows all steps grouped by category
  - Completion status indicators
  - Direct navigation to accessible steps
  - Responsive design (hidden on mobile)

#### EnhancedQuestionnaireWrapper
- **Purpose**: Layout wrapper with navigation controls
- **Features**:
  - Bottom navigation bar integration
  - Exit button with confirmation
  - Progress tracker integration
  - Responsive layout management

## Usage Guide

### 🚀 Getting Started

1. **Navigate to the questionnaire**:
   ```typescript
   // User visits /property/new
   ```

2. **The system automatically**:
   - Loads saved progress from localStorage (if any)
   - Displays the current step
   - Shows progress tracker (on desktop)
   - Enables appropriate navigation

### 📝 Adding New Steps

1. **Create the view component**:
   ```typescript
   // views/YourNewStep.tsx
   'use client'
   
   import { usePropertyListingStore } from '@/stores/propertyListingStore'
   
   function YourNewStep() {
     const { data, updateData, markStepCompleted } = usePropertyListingStore()
     
     // Your component logic
     
     return (
       <div className="max-w-6xl mx-auto p-8">
         {/* Your step content */}
       </div>
     )
   }
   ```

2. **Update the store configuration**:
   ```typescript
   // In propertyListingStore.ts, add to initialSteps array
   {
     id: 'your-step-id',
     title: 'Your Step Title',
     component: 'YourNewStep',
     isCompleted: false,
     isAccessible: false,
   }
   ```

3. **Add component mapping**:
   ```typescript
   // In app/property/new/page.tsx
   import YourNewStep from '@/views/YourNewStep'
   
   const componentMap = {
     // ... existing components
     YourNewStep,
   }
   ```

4. **Add validation (optional)**:
   ```typescript
   // In propertyListingStore.ts, update validateCurrentStep()
   case 'your-step-id':
     return /* your validation logic */
   ```

### 🔧 Customizing Form Data

Update the `PropertyListingData` interface in the store:

```typescript
export interface PropertyListingData {
  // Existing fields...
  
  // Add your new fields
  yourNewField: string
  anotherField: number
  // etc.
}
```

### 🎨 Styling and Theming

The system uses Tailwind CSS with a consistent design system:

- **Primary color**: Teal (`bg-teal-600`, `text-teal-600`)
- **Success color**: Green (`bg-green-500`, `text-green-700`)
- **Progress color**: Teal gradient
- **Text colors**: Slate scale (`text-slate-900`, `text-slate-600`)

### 📱 Responsive Behavior

- **Desktop**: Shows progress tracker sidebar + main content
- **Tablet**: Hides progress tracker, full-width content
- **Mobile**: Optimized layout with bottom navigation

## API Integration

### 🔌 Form Submission

The system submits data to `/api/properties` when completed:

```typescript
// In propertyListingStore.ts
submitForm: async () => {
  const response = await fetch('/api/properties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  
  if (response.ok) {
    // Clear temporary data and redirect
    clearTemporaryData()
  }
}
```

### 🔄 Data Persistence

Data is automatically saved to localStorage as the user progresses:

```typescript
// Zustand persist middleware configuration
persist(
  (set, get) => ({ /* store logic */ }),
  {
    name: 'property-listing-storage',
    storage: createJSONStorage(() => localStorage),
  }
)
```

## Step Sequence

The questionnaire follows this predefined sequence:

1. **Introduction** (`AddListingFirst`)
2. **Step 1 Intro** (`AddListingStepOne`)
3. **Property Type** (`AddListingStepOnePlace`) - 🔒 Validation Required
4. **Location & Map** (`AddListingStepOneMap`)
5. **Address Details** (`AddListingStepOneLocation`) - 🔒 Validation Required
6. **Basic Info** (`AddListingStepOneBasic`) - 🔒 Validation Required
7. **Property Details** (`AddListingStepOneDetails`)
8. **Step 2 Intro** (`AddListingStepTwo`)
9. **Photos** (`AddListingStepTwoPhotos`)
10. **Management** (`AddListingStepTwoManage`)
11. **Title** (`AddListingStepTwoTitle`) - 🔒 Validation Required
12. **Description** (`AddListingStepTwoDescription`) - 🔒 Validation Required
13. **Step 3 Intro** (`AddListingStepThree`)
14. **Legal** (`AddListingStepThreeLegal`)
15. **Pricing** (`AddListingStepThreePrice`) - 🔒 Validation Required

🔒 = Steps with validation requirements

## Best Practices

### ✅ Do's
- Always use the store for form data management
- Add validation for critical steps
- Provide clear user feedback
- Test on mobile devices
- Handle API errors gracefully

### ❌ Don'ts
- Don't store sensitive data in localStorage
- Don't skip validation for important fields
- Don't make abrupt navigation changes
- Don't ignore accessibility requirements

## Troubleshooting

### Common Issues

1. **Progress not saving**: Check localStorage permissions
2. **Step validation failing**: Review validation logic in store
3. **Component not rendering**: Verify component mapping
4. **API submission failing**: Check network and error handling

### Debugging Tips

```typescript
// Check current store state
console.log(usePropertyListingStore.getState())

// Monitor step changes
usePropertyListingStore.subscribe((state) => {
  console.log('Current step:', state.currentStep)
})
```

## Future Enhancements

- [ ] Auto-save draft functionality
- [ ] Step-specific error handling
- [ ] Undo/redo functionality
- [ ] Bulk upload capabilities
- [ ] Integration with external APIs
- [ ] Advanced validation rules
- [ ] Multi-language support
- [ ] Accessibility improvements