import React, { useState, useEffect } from 'react';
import { Calculator, Plus, Trash2, Download, Upload, User, Home, CheckCircle, XCircle } from 'lucide-react';
import { EnergyBill, EnergyGroupBill, SharedPropertyConsumption, Property, Tenant } from '../../types';
import { distributeEnergyGroupBill, createSharedPropertyConsumption } from '../../utils/energyCalculations';

interface EnergyCalculatorProps {
  energyBills: EnergyBill[];
  onSaveEnergyBill: (bill: EnergyBill) => void;
  editingBill?: EnergyBill;
  onCancelEdit: () => void;
  properties: Property[];
  tenants: Tenant[];
}

const DEFAULT_ENERGY_GROUPS = [
  { id: 'group1', name: 'Grupo 1 (802-Ca)', properties: ['802- Ca 01 Manoel', '802- Ca 02 