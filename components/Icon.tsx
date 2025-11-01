import React from 'react';
import { iconMap } from '../constants';
import { LucideProps, HelpCircle } from 'lucide-react';

// FIX: Changed the prop type definition from an interface extending LucideProps
// to a type alias using an intersection (&). This resolves TypeScript errors where
// props like `className` and `size` were not being correctly inherited from `LucideProps`.
type IconProps = LucideProps & {
  name: string;
};

const Icon: React.FC<IconProps> = ({ name, ...props }) => {
  const LucideIcon = iconMap[name];

  if (!LucideIcon) {
    // Return a default icon or null if the name is not found
    return <HelpCircle {...props} />;
  }

  return <LucideIcon {...props} />;
};

export default Icon;
