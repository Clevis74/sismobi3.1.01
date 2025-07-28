import React, { useState } from 'react';
import { Plus, Edit, Trash2, FileText, Calendar, User, Home, AlertCircle, CheckCircle, Clock, Filter } from 'lucide-react';
import { Document, Property, Tenant } from '../../types';
import { DocumentForm } from './DocumentForm';
import { formatDate } from '../../utils/calculations';

interface DocumentManagerProps {
  documents: Document[];
  properties: Property[];
  tenants: Tenant[];
  onAddDocument: (document: Omit<Document, 'id' | 'lastUpdated'>) => void;
  onUpdateDocument: (id: string, document: Partial<Document>) => void;
  onDeleteDocument: (id: string) => void;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  documents,
  properties,
  tenants,
  onAddDocument,
  onUpdateDocument,
  onDeleteDocument
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [filter, setFilter] = useState<'all' | 'valid' | 'expired' | 'pending'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const handleAddDocument = (documentData: Omit<Document, 'id' | 'lastUpdated'>) => {
    onAddDocument(documentData);
    setShowForm(false);
  };

  const handleEditDocument = (document: Document) => {
    setEditingDocument(document);
    setShowForm(true);
  };

  const handleUpdateDocument = (documentData: Omit<Document, 'id' | 'lastUpdated'>) => {
    if (editingDocument) {
      onUpdateDocument(editingDocument.id, documentData);
      setEditingDocument(null);
      setShowForm(false);
    }
  };

  const filteredDocuments = documents.filter(document => {
    const statusMatch = filter === 'all' || 
      (filter === 'valid' && document.status === 'Válido') ||
      (filter === 'expired' && document.status === 'Expirado') ||
      (filter === 'pending' && document.status === 'Pendente');
    
    const typeMatch = typeFilter === 'all' || document.type === typeFilter;
    
    return statusMatch && typeMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Válido': return 'bg-green-100 text-green-800';
      case 'Expirado': return 'bg-red-100 text-red-800';
      case 'Pendente': return 'bg-yellow-100 text-yellow-800';
      case 'Revisão': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Válido': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Expirado': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'Pendente': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'Revisão': return <AlertCircle className="w-4 h-4 text-blue-600" />;
      default: return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const documentTypes = [...new Set(documents.map(d => d.type))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Documentos</h2>
          <p className="text-gray-600 mt-1">
            {documents.length} documento{documents.length !== 1 ? 's' : ''} cadastrado{documents.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Documento
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'valid' | 'expired' | 'pending')}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os status</option>
            <option value="valid">Válidos</option>
            <option value="expired">Expirados</option>
            <option value="pending">Pendentes</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os tipos</option>
            {documentTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {showForm && (
        <DocumentForm
          document={editingDocument}
          properties={properties}
          tenants={tenants}
          onSubmit={editingDocument ? handleUpdateDocument : handleAddDocument}
          onCancel={() => {
            setShowForm(false);
            setEditingDocument(null);
          }}
        />
      )}

      {/* Lista de Documentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredDocuments.map((document) => {
          const property = properties.find(p => p.id === document.propertyId);
          const tenant = tenants.find(t => t.id === document.tenantId);
          
          return (
            <div key={document.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{document.type}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusIcon(document.status)}
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                        {document.status}
                      </span>
                      {document.contractSigned && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Assinado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditDocument(document)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteDocument(document.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Emissão: {formatDate(document.issueDate)}</span>
                  </div>
                  
                  {document.hasValidity && document.validityDate && (
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Validade: {formatDate(document.validityDate)}</span>
                    </div>
                  )}
                  
                  {!document.hasValidity && (
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Sem validade</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Home className="w-4 h-4 mr-2" />
                    <span>Propriedade: {property?.name || 'Não encontrada'}</span>
                  </div>
                  
                  {tenant && (
                    <div className="flex items-center text-gray-600">
                      <User className="w-4 h-4 mr-2" />
                      <span>Inquilino: {tenant.name}</span>
                    </div>
                  )}
                </div>

                {document.fileName && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Arquivo:</span> {document.fileName}
                  </div>
                )}

                {document.observations && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Observações:</span>
                    <p className="mt-1 text-gray-700">{document.observations}</p>
                  </div>
                )}

                <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                  Última atualização: {formatDate(document.lastUpdated)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {filter === 'all' && typeFilter === 'all' 
              ? 'Nenhum documento cadastrado' 
              : 'Nenhum documento encontrado com os filtros aplicados'
            }
          </p>
          <p className="text-gray-400 mt-2">
            {filter === 'all' && typeFilter === 'all'
              ? 'Comece adicionando seu primeiro documento'
              : 'Tente ajustar os filtros ou adicionar novos documentos'
            }
          </p>
        </div>
      )}
    </div>
  );
};