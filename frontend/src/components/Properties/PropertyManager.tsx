import React, { useState } from 'react';
import { Plus, Edit, Trash2, MapPin, DollarSign } from 'lucide-react';
import { Property } from '../../types';
import { PropertyForm } from './PropertyForm';
import { formatCurrency } from '../../utils/calculations';

interface PropertyManagerProps {
  properties: Property[];
  showValues: boolean;
  onAddProperty: (property: Omit<Property, 'id' | 'createdAt'>) => void;
  onUpdateProperty: (id: string, property: Partial<Property>) => void;
  onDeleteProperty: (id: string) => void;
}

export const PropertyManager: React.FC<{
  properties,
  showValues,
  onAddProperty,
  onUpdateProperty,
  onDeleteProperty
}> = ({
  properties,
  showValues,
  onAddProperty,
  onUpdateProperty,
  onDeleteProperty
}): JSX.Element => {
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  const handleAddProperty = (propertyData: Omit<Property, 'id' | 'createdAt'>): void => {
    onAddProperty(propertyData);
    setShowForm(false);
  };

  const handleEditProperty = (property: Property): void => {
    setEditingProperty(property);
    setShowForm(true);
  };

  const handleUpdateProperty = (propertyData: Omit<Property, 'id' | 'createdAt'>): void => {
    if (editingProperty) {
      onUpdateProperty(editingProperty.id, propertyData);
      setEditingProperty(null);
      setShowForm(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rented': return 'bg-green-100 text-green-800';
      case 'vacant': return 'bg-yellow-100 text-yellow-800';
      case 'maintenance': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'rented': return 'Alugado';
      case 'vacant': return 'Vago';
      case 'maintenance': return 'Manutenção';
      default: return 'Indefinido';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestão de Propriedades</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Propriedade
        </button>
      </div>

      {showForm && (
        <PropertyForm
          property={editingProperty}
          onSubmit={editingProperty ? handleUpdateProperty : handleAddProperty}
          onCancel={() => {
            setShowForm(false);
            setEditingProperty(null);
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{property.name}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(property.status)}`}>
                  {getStatusText(property.status)}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span className="text-sm">{property.address}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">
                    {showValues ? `${formatCurrency(property.rentValue)}/mês` : '****/mês'}
                  </span>
                </div>
              </div>

              <div className="text-sm text-gray-500 mb-4">
                <p>Tipo: {property.type === 'apartment' ? 'Apartamento' : property.type === 'house' ? 'Casa' : 'Comercial'}</p>
                <p>Valor de Compra: {showValues ? formatCurrency(property.purchasePrice) : '****'}</p>
                {property.tenant && (
                  <p>Inquilino: {property.tenant.name}</p>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => handleEditProperty(property)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteProperty(property.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {properties.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Nenhuma propriedade cadastrada</p>
          <p className="text-gray-400 mt-2">Comece adicionando sua primeira propriedade</p>
        </div>
      )}
    </div>
  );
};