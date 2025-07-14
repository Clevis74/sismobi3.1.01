import { SharedPropertyConsumption, EnergyBill, EnergyGroup } from '../types';

// Grupos predefinidos conforme especificação
export const DEFAULT_ENERGY_GROUPS: EnergyGroup[] = [
  {
    id: 'group1',
    name: 'Grupo 1 (802-Ca)',
    properties: ['802-Ca 01', '802-Ca 02', '802-Ca 06'],
    residualReceiver: '802-Ca 02'
  },
  {
    id: 'group2',
    name: 'Grupo 2 (802-Ca)',
    properties: ['802-Ca 03', '802-Ca 04', '802-Ca 05'],
    residualReceiver: '802-Ca 05'
  },
  {
    id: 'group3',
    name: 'Grupo 3 (117-Ca)',
    properties: ['117-Ca 01', '117-Ca 03'],
    residualReceiver: '117-Ca 01'
  }
];

/**
 * Calcula o consumo mensal baseado nas leituras atual e anterior
 */
export const calculateMonthlyConsumption = (
  currentReading: number,
  previousReading: number
): number => {
  return Math.max(0, currentReading - previousReading);
};

/**
 * Valida se a soma dos consumos individuais está consistente
 */
export const validateConsumptionData = (
  properties: SharedPropertyConsumption[],
  totalConsumption: number
): { isValid: boolean; message: string; difference: number } => {
  const sumOfIndividualConsumptions = properties.reduce(
    (sum, prop) => sum + prop.monthlyConsumption,
    0
  );

  const difference = Math.abs(totalConsumption - sumOfIndividualConsumptions);
  const tolerance = totalConsumption * 0.05; // 5% de tolerância

  if (difference <= tolerance) {
    return {
      isValid: true,
      message: 'Consumos estão consistentes',
      difference
    };
  }

  return {
    isValid: false,
    message: `Diferença de ${difference.toFixed(2)} kWh entre total e soma individual`,
    difference
  };
};

/**
 * Distribui a conta de energia proporcionalmente entre os imóveis
 */
export const distributeEnergyBill = (
  totalValue: number,
  totalConsumption: number,
  properties: SharedPropertyConsumption[]
): SharedPropertyConsumption[] => {
  if (totalConsumption === 0 || totalValue === 0) {
    return properties.map(prop => ({
      ...prop,
      proportionalValue: 0,
      proportionalConsumption: 0
    }));
  }

  const valuePerKwh = totalValue / totalConsumption;
  const updatedProperties = [...properties];

  // Agrupar propriedades por grupo
  const groups = DEFAULT_ENERGY_GROUPS.reduce((acc, group) => {
    acc[group.id] = {
      ...group,
      properties: properties.filter(prop => group.properties.includes(prop.name))
    };
    return acc;
  }, {} as Record<string, EnergyGroup & { properties: SharedPropertyConsumption[] }>);

  // Processar cada grupo
  Object.values(groups).forEach(group => {
    const groupProperties = group.properties;
    const propertiesWithMeter = groupProperties.filter(prop => prop.hasMeter);
    const residualProperty = groupProperties.find(prop => prop.name === group.residualReceiver);

    if (!residualProperty) return;

    // Calcular consumo total do grupo
    const groupTotalConsumption = groupProperties.reduce(
      (sum, prop) => sum + prop.monthlyConsumption,
      0
    );

    // Calcular consumo dos imóveis com medidor
    const meterConsumption = propertiesWithMeter.reduce(
      (sum, prop) => sum + prop.monthlyConsumption,
      0
    );

    // Consumo residual para o imóvel sem medidor
    const residualConsumption = groupTotalConsumption - meterConsumption;

    // Distribuir valores proporcionalmente
    groupProperties.forEach(prop => {
      const propIndex = updatedProperties.findIndex(p => p.id === prop.id);
      
      if (prop.hasMeter) {
        // Imóvel com medidor: valor proporcional ao consumo
        const proportionalValue = prop.monthlyConsumption * valuePerKwh;
        updatedProperties[propIndex] = {
          ...updatedProperties[propIndex],
          proportionalValue,
          proportionalConsumption: prop.monthlyConsumption
        };
      } else if (prop.name === group.residualReceiver) {
        // Imóvel sem medidor: recebe o residual
        const residualValue = residualConsumption * valuePerKwh;
        updatedProperties[propIndex] = {
          ...updatedProperties[propIndex],
          proportionalValue: residualValue,
          proportionalConsumption: residualConsumption
        };
      }
    });
  });

  return updatedProperties;
};

/**
 * Cria uma nova propriedade de consumo compartilhado
 */
export const createSharedPropertyConsumption = (
  name: string,
  groupId: string,
  hasMeter: boolean = true,
  isResidualReceiver: boolean = false
): Omit<SharedPropertyConsumption, 'id'> => {
  return {
    name,
    currentReading: 0,
    previousReading: 0,
    monthlyConsumption: 0,
    hasMeter,
    proportionalValue: 0,
    proportionalConsumption: 0,
    groupId,
    isResidualReceiver
  };
};

/**
 * Importa dados do mês anterior
 */
export const importPreviousMonthData = (
  currentProperties: SharedPropertyConsumption[],
  previousBill: EnergyBill | null
): SharedPropertyConsumption[] => {
  if (!previousBill) return currentProperties;

  return currentProperties.map(prop => {
    const previousProp = previousBill.properties.find(p => p.name === prop.name);
    if (previousProp) {
      return {
        ...prop,
        previousReading: previousProp.currentReading,
        monthlyConsumption: calculateMonthlyConsumption(
          prop.currentReading,
          previousProp.currentReading
        )
      };
    }
    return prop;
  });
};

/**
 * Gera sugestões inteligentes baseadas no histórico
 */
export const generateConsumptionInsights = (
  currentBill: EnergyBill,
  previousBills: EnergyBill[]
): string[] => {
  const insights: string[] = [];

  if (previousBills.length === 0) return insights;

  const lastBill = previousBills[previousBills.length - 1];
  const consumptionIncrease = currentBill.totalConsumption - lastBill.totalConsumption;
  const percentageIncrease = (consumptionIncrease / lastBill.totalConsumption) * 100;

  if (percentageIncrease > 20) {
    insights.push(`Consumo ${percentageIncrease.toFixed(1)}% maior que o mês anterior. Possível uso intensivo de ar-condicionado ou novos equipamentos.`);
  } else if (percentageIncrease < -20) {
    insights.push(`Consumo ${Math.abs(percentageIncrease).toFixed(1)}% menor que o mês anterior. Possível ausência dos moradores ou economia de energia.`);
  }

  // Verificar propriedades com consumo muito alto
  currentBill.properties.forEach(prop => {
    const previousProp = lastBill.properties.find(p => p.name === prop.name);
    if (previousProp) {
      const propIncrease = ((prop.monthlyConsumption - previousProp.monthlyConsumption) / previousProp.monthlyConsumption) * 100;
      if (propIncrease > 50) {
        insights.push(`${prop.name}: Consumo ${propIncrease.toFixed(1)}% maior. Verificar possíveis problemas ou novos equipamentos.`);
      }
    }
  });

  return insights;
};

/**
 * Calcula estatísticas do histórico de consumo
 */
export const calculateConsumptionStats = (bills: EnergyBill[]) => {
  if (bills.length === 0) {
    return {
      averageConsumption: 0,
      averageValue: 0,
      trend: 'stable' as 'increasing' | 'decreasing' | 'stable',
      monthlyVariation: 0
    };
  }

  const totalConsumption = bills.reduce((sum, bill) => sum + bill.totalConsumption, 0);
  const totalValue = bills.reduce((sum, bill) => sum + bill.totalValue, 0);
  const averageConsumption = totalConsumption / bills.length;
  const averageValue = totalValue / bills.length;

  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  let monthlyVariation = 0;

  if (bills.length >= 2) {
    const recent = bills.slice(-3); // Últimos 3 meses
    const older = bills.slice(-6, -3); // 3 meses anteriores

    if (recent.length > 0 && older.length > 0) {
      const recentAvg = recent.reduce((sum, bill) => sum + bill.totalConsumption, 0) / recent.length;
      const olderAvg = older.reduce((sum, bill) => sum + bill.totalConsumption, 0) / older.length;
      
      monthlyVariation = ((recentAvg - olderAvg) / olderAvg) * 100;
      
      if (monthlyVariation > 5) trend = 'increasing';
      else if (monthlyVariation < -5) trend = 'decreasing';
    }
  }

  return {
    averageConsumption,
    averageValue,
    trend,
    monthlyVariation
  };
};