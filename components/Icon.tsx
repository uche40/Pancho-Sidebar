import React from 'react';
import { iconMap } from '../constants';
import { LucideProps, HelpCircle } from 'lucide-react';

interface IconProps extends LucideProps {
  name: string;
}

const Icon: React.FC<IconProps> = ({ name, ...props }) => {
  const LucideIcon = iconMap[name];

  if (!LucideIcon) {
    // Return a default icon or null if the name is not found
    return <HelpCircle {...props} />;
  }

  return <LucideIcon {...props} />;
};

export default Icon;
