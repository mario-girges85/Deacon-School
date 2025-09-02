# Components

This directory contains reusable React components used throughout the application.

## HymnCard

A reusable component for displaying hymn information in a card format.

### Props

- `hymn` (object, required): The hymn object containing hymn data
- `onClick` (function, optional): Callback function when the card is clicked
- `className` (string, optional): Additional CSS classes to apply to the card
- `showEvent` (boolean, optional, default: true): Whether to show the event information
- `showDuration` (boolean, optional, default: true): Whether to show the duration
- `showDescription` (boolean, optional, default: true): Whether to show the description
- `showLyricsInfo` (boolean, optional, default: true): Whether to show lyrics language info
- `showAudioIcon` (boolean, optional, default: true): Whether to show the audio icon
- `clickable` (boolean, optional, default: true): Whether the card should be clickable

### Usage Examples

#### Basic Usage

```jsx
import HymnCard from "../components/HymnCard";

<HymnCard hymn={hymnData} onClick={(hymn) => navigate(`/hymns/${hymn.id}`)} />;
```

#### Non-clickable Card

```jsx
<HymnCard hymn={hymnData} clickable={false} showDescription={false} />
```

#### Custom Styling

```jsx
<HymnCard
  hymn={hymnData}
  className="border-2 border-blue-500"
  showEvent={false}
  showDuration={false}
/>
```

### Features

- Responsive design that works on mobile and desktop
- Configurable display options for different use cases
- Audio icon indicator when audio is available
- Duration formatting
- Lyrics language indicators
- Hover effects and transitions
- Line clamping for long text content
