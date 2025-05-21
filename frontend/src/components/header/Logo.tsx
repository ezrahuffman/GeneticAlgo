import React from 'react';
import { Box } from 'lucide-react'; // Using Box as a placeholder for the cube

interface LogoProps {
  size?: number;
  color?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 24, color = '#e8eaed' }) => {
  return <Box size={size} color={color} aria-label="Company Logo" />;
};

export default Logo;