import React, { useState, useEffect } from 'react';
import { X, Download, RefreshCw, FileText, User, Home, Zap, Droplets } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { Tenant, Property, EnergyBill, WaterBill } from '../../types';
import { formatCurrency } from '../../utils/optimizedCalculations';

interface TenantConsumptionData {
  tenant: Tenant;
  property: Property | null;
  energyData: {
    totalGroupValue: number;
    proportionalValue: number;
    paymentStatus: 'paid' | 'pending' | 'overdue';
  } | null;
  waterData: {
    totalGroupValue: number;
    proportionalValue: number;
    paymentStatus: 'paid' | 'pending' | 'overdue';
  } | null;
  totalAmount: number;
}

interface TenantConsumptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  properties: Property[];
  energyBills: EnergyBill[];
  waterBills: WaterBill[];
  onRefresh?: () => void;
  showValues: boolean;
}

export const TenantConsumptionModal: React.FC<TenantConsumptionModalProps> = ({
  isOpen,
  onClose,
  tenant,
  properties,
  energyBills,
  waterBills,
  onRefresh,
  showValues
}) => {
  const [consumptionData, setConsumptionData] = useState<TenantConsumptionData | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calcular dados de consumo quando o modal abrir
  useEffect(() => {
    if (!isOpen || !tenant) {
      setConsumptionData(null);
      setError(null);
      return;
    }

    try {
      // Encontrar propriedade vinculada
      const property = properties.find(p => p.id === tenant.propertyId) || null;
      
      if (!property) {
        setError('Propriedade não encontrada');
        return;
      }

      // Buscar dados mais recentes de energia para esta propriedade
      const latestEnergyBill = energyBills
        .filter(bill => 
          bill.propertiesInGroup?.some(prop => prop.propertyId === tenant.propertyId)
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      // Buscar dados mais recentes de água para esta propriedade  
      const latestWaterBill = waterBills
        .filter(bill => 
          bill.propertiesInGroup?.some(prop => prop.propertyId === tenant.propertyId)
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      // Extrair dados de energia
      let energyData = null;
      if (latestEnergyBill) {
        const energyProperty = latestEnergyBill.propertiesInGroup?.find(
          prop => prop.propertyId === tenant.propertyId
        );
        
        if (energyProperty) {
          energyData = {
            totalGroupValue: latestEnergyBill.totalGroupValue,
            proportionalValue: energyProperty.proportionalValue,
            paymentStatus: energyProperty.isPaid ? 'paid' : 
                          (energyProperty.dueDate && new Date(energyProperty.dueDate) < new Date()) ? 'overdue' : 'pending'
          };
        }
      }

      // Extrair dados de água
      let waterData = null;
      if (latestWaterBill) {
        const waterProperty = latestWaterBill.propertiesInGroup?.find(
          prop => prop.propertyId === tenant.propertyId
        );
        
        if (waterProperty) {
          waterData = {
            totalGroupValue: latestWaterBill.totalGroupValue,
            proportionalValue: waterProperty.proportionalValue,
            paymentStatus: waterProperty.isPaid ? 'paid' : 
                          (waterProperty.dueDate && new Date(waterProperty.dueDate) < new Date()) ? 'overdue' : 'pending'
          };
        }
      }

      // Calcular total
      const totalAmount = (energyData?.proportionalValue || 0) + (waterData?.proportionalValue || 0);

      setConsumptionData({
        tenant,
        property,
        energyData,
        waterData,
        totalAmount
      });
      
      setError(null);
    } catch (err) {
      console.error('Erro ao calcular dados de consumo:', err);
      setError('Erro ao carregar dados de consumo');
    }
  }, [isOpen, tenant, properties, energyBills, waterBills]);

  const getPaymentStatusIcon = (status: 'paid' | 'pending' | 'overdue') => {
    switch (status) {
      case 'paid':
        return '✅';
      case 'pending':
        return '⚠️';
      case 'overdue':
        return '❌';
      default:
        return '⚠️';
    }
  };

  const getPaymentStatusText = (status: 'paid' | 'pending' | 'overdue') => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'pending':
        return 'Pendente';
      case 'overdue':
        return 'Vencido';
      default:
        return 'Indefinido';
    }
  };

  const handleGeneratePdf = async () => {
    if (!consumptionData || isGeneratingPdf) return;

    try {
      setIsGeneratingPdf(true);

      const element = document.getElementById('consumption-report');
      if (!element) {
        throw new Error('Elemento do relatório não encontrado');
      }

      const opt = {
        margin: 1,
        filename: `consumo-${consumptionData.tenant.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      setError('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
    // Reprocessar dados após atualização
    if (tenant) {
      // Os dados serão reprocessados pelo useEffect quando as props mudarem
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !tenant) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="consumption-modal-title"
    >
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <FileText className="w-6 h-6 text-blue-600 mr-3" />
            <h2 id="consumption-modal-title" className="text-xl font-semibold text-gray-900">
              📋 Consumo - {tenant.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error ? (
            <div className="text-center py-8">
              <div className="text-red-600 text-lg mb-4">❌ {error}</div>
              <button
                onClick={() => setError(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          ) : !consumptionData ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando dados de consumo...</p>
            </div>
          ) : (
            <div id="consumption-report">
              {/* Dados do Inquilino */}
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <User className="w-5 h-5 text-gray-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Dados do Inquilino</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Nome:</span>
                    <span className="ml-2 text-gray-900">{consumptionData.tenant.name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">CPF:</span>
                    <span className="ml-2 text-gray-900">{consumptionData.tenant.cpf || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Propriedade Vinculada */}
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <Home className="w-5 h-5 text-gray-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Propriedade Vinculada</h3>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-600">Endereço:</span>
                  <span className="ml-2 text-gray-900">
                    {consumptionData.property ? consumptionData.property.name : 'Não vinculada'}
                  </span>
                </div>
              </div>

              {/* Consumo de Energia */}
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <Zap className="w-5 h-5 text-yellow-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Energia Elétrica</h3>
                </div>
                
                {consumptionData.energyData ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Valor Total (Grupo):</span>
                        <span className="ml-2 text-gray-900">
                          {showValues ? formatCurrency(consumptionData.energyData.totalGroupValue) : '****'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Valor Proporcional:</span>
                        <span className="ml-2 font-semibold text-yellow-700">
                          {showValues ? formatCurrency(consumptionData.energyData.proportionalValue) : '****'}
                        </span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-600">Status:</span>
                        <span className="ml-2">
                          {getPaymentStatusIcon(consumptionData.energyData.paymentStatus)} {getPaymentStatusText(consumptionData.energyData.paymentStatus)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4">
                    Dados de energia não disponíveis
                  </div>
                )}
              </div>

              {/* Consumo de Água */}
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <Droplets className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Água</h3>
                </div>
                
                {consumptionData.waterData ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Valor Total (Grupo):</span>
                        <span className="ml-2 text-gray-900">
                          {showValues ? formatCurrency(consumptionData.waterData.totalGroupValue) : '****'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Valor Proporcional:</span>
                        <span className="ml-2 font-semibold text-blue-700">
                          {showValues ? formatCurrency(consumptionData.waterData.proportionalValue) : '****'}
                        </span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-600">Status:</span>
                        <span className="ml-2">
                          {getPaymentStatusIcon(consumptionData.waterData.paymentStatus)} {getPaymentStatusText(consumptionData.waterData.paymentStatus)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4">
                    Dados de água não disponíveis
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 pt-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Soma Total (Água + Energia):</span>
                    <span className="text-xl font-bold text-green-700">
                      {showValues ? formatCurrency(consumptionData.totalAmount) : '****'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleRefresh}
            disabled={!onRefresh}
            className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
              onRefresh 
                ? 'border-gray-300 text-gray-700 hover:bg-gray-50' 
                : 'border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            🔄 Atualizar Dados
          </button>
          
          <button
            onClick={handleGeneratePdf}
            disabled={!consumptionData || isGeneratingPdf}
            className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
              consumptionData && !isGeneratingPdf
                ? 'border-blue-300 text-blue-700 hover:bg-blue-50'
                : 'border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Download className={`w-4 h-4 mr-2 ${isGeneratingPdf ? 'animate-spin' : ''}`} />
            🖨️ Gerar PDF
          </button>
        </div>
      </div>
    </div>
  );
};