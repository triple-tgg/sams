/**
 * Quick Usage Guide for Input Component with Number Type
 */

import { Input } from '@/components/ui/input'

// Basic usage examples:

// 1. Simple number input with min and max
<Input 
  type="number" 
  min={0} 
  max={100} 
  placeholder="Enter value 0-100" 
/>

// 2. Age input with validation
<Input 
  type="number" 
  min={18} 
  max={120} 
  step={1} 
  placeholder="Enter your age" 
/>

// 3. Price input with decimal places
<Input 
  type="number" 
  min={0} 
  max={9999.99} 
  step={0.01} 
  placeholder="0.00" 
/>

// 4. Percentage input
<Input 
  type="number" 
  min={0} 
  max={100} 
  step={1} 
  placeholder="Enter percentage" 
/>

// 5. Flight capacity
<Input 
  type="number" 
  min={1} 
  max={850} 
  step={1} 
  defaultValue={150}
  color="primary"
  size="md"
/>

// 6. Temperature with negative values
<Input 
  type="number" 
  min={-50} 
  max={50} 
  step={0.1} 
  placeholder="Temperature (°C)" 
/>

// Common aircraft maintenance examples:

// Fuel quantity
<Input type="number" min={0} max={500000} step={0.1} placeholder="Fuel (Liters)" />

// Flight duration
<Input type="number" min={0.1} max={20} step={0.1} placeholder="Duration (Hours)" />

// Altitude
<Input type="number" min={0} max={50000} step={100} placeholder="Altitude (feet)" />

// Passenger count
<Input type="number" min={0} max={850} step={1} placeholder="Passengers" />

export {};