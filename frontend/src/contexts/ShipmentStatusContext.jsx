// src/contexts/ShipmentStatusContext.jsx
import { createContext, useContext, useState } from 'react';

const ShipmentStatusContext = createContext(undefined);

export function ShipmentStatusProvider({ children }) {
  const [shipmentStatus, setShipmentStatus] = useState(null);

  const value = {
    shipmentStatus,
    setShipmentStatus,
    isScanningActive: shipmentStatus === 6,
  };

  return (
    <ShipmentStatusContext.Provider value={value}>
      {children}
    </ShipmentStatusContext.Provider>
  );
}

export function useShipmentStatus() {
  const context = useContext(ShipmentStatusContext);
  if (context === undefined) {
    throw new Error('useShipmentStatus must be used inside ShipmentStatusProvider');
  }
  return context;
}