# ClassCard Component

A reusable React component for displaying class information in different layouts.

## Features

- **Multiple Variants**: Default, compact, and detailed layouts
- **Customizable**: Accepts custom onClick handlers and CSS classes
- **Responsive**: Works well on different screen sizes
- **Accessible**: Proper ARIA labels and keyboard navigation
- **TypeScript Ready**: Includes PropTypes for type checking

## Props

| Prop                  | Type     | Required | Default     | Description                                      |
| --------------------- | -------- | -------- | ----------- | ------------------------------------------------ |
| `classItem`           | Object   | Yes      | -           | Class data object                                |
| `getLevelName`        | Function | Yes      | -           | Function to get level name                       |
| `getStageName`        | Function | Yes      | -           | Function to get stage name                       |
| `onClick`             | Function | No       | -           | Custom click handler                             |
| `showActionIndicator` | Boolean  | No       | `true`      | Show/hide action indicator                       |
| `className`           | String   | No       | `""`        | Additional CSS classes                           |
| `variant`             | String   | No       | `"default"` | Layout variant: "default", "compact", "detailed" |

## Usage Examples

### Basic Usage (Default Variant)

```jsx
import ClassCard from "../components/ClassCard";

<ClassCard
  classItem={classData}
  getLevelName={getLevelName}
  getStageName={getStageName}
/>;
```

### Compact Variant

```jsx
<ClassCard
  classItem={classData}
  getLevelName={getLevelName}
  getStageName={getStageName}
  variant="compact"
/>
```

### Custom Click Handler

```jsx
<ClassCard
  classItem={classData}
  getLevelName={getLevelName}
  getStageName={getStageName}
  onClick={(classItem) => console.log("Clicked:", classItem)}
/>
```

### Without Action Indicator

```jsx
<ClassCard
  classItem={classData}
  getLevelName={getLevelName}
  getStageName={getStageName}
  showActionIndicator={false}
/>
```

### With Custom Styling

```jsx
<ClassCard
  classItem={classData}
  getLevelName={getLevelName}
  getStageName={getStageName}
  className="border-2 border-blue-500"
/>
```

## Variants

### Default

- Full-size card with detailed information
- Includes action indicator
- Best for main class listings

### Compact

- Smaller card with essential information
- Good for sidebars or dense layouts
- No action indicator

### Detailed

- Full information with enhanced styling
- Best for featured or important classes
- Includes action indicator

## Class Item Structure

The `classItem` prop should have this structure:

```javascript
{
  id: "uuid-string",
  location: "Floor 1 - Room 101",
  level: {
    level: 1,
    stage: 2
  }
}
```

## Styling

The component uses Tailwind CSS classes and can be customized with:

- `className` prop for additional classes
- CSS custom properties for theming
- Tailwind's utility classes for modifications
