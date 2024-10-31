// src/App.tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import { OptimizationDashboard } from './components/OptimizationDashboard';

export const App = () => (
  <ChakraProvider value={defaultSystem}>
    <OptimizationDashboard />
  </ChakraProvider>

)



// src/components/OptimizationDashboard.tsx
