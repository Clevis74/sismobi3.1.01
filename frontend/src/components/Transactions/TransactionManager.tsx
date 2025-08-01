import React, { useState } from 'react';
import { Plus, Edit, Trash2, Calendar, DollarSign, Tag, Filter } from 'lucide-react';
import { Transaction } from '../../types';
import { TransactionForm } from './TransactionForm';
import { formatCurrency, formatDate } from '../../utils/calculations';

interface TransactionManagerProps {
  transactions: Transaction[];
  properties: any[];
  showValues: boolean;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onUpdateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  onDeleteTransaction: (id: string) => void;
}

export const TransactionManager: React.FC<TransactionManagerProps> = ({
  transactions,
  properties,
  showValues,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const handleAddTransaction = (transactionData: Omit<Transaction, 'id'>): void => {
    onAddTransaction(transactionData);
    setShowForm(false);
  };

  const handleEditTransaction = (transaction: Transaction): void => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleUpdateTransaction = (transactionData: Omit<Transaction, 'id'>): void => {
    if (editingTransaction) {
      onUpdateTransaction(editingTransaction.id, transactionData);
      setEditingTransaction(null);
      setShowForm(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const typeMatch = filter === 'all' || transaction.type === filter;
    const categoryMatch = categoryFilter === 'all' || transaction.category === categoryFilter;
    return typeMatch && categoryMatch;
  });

  const categories = [...new Set(transactions.map(t => t.category))];

  const getTransactionColor = (type: string): void => {
    return type === 'income' ? 'text-green-600' : 'text-red-600';
  };

  const getTransactionIcon = (type: string): void => {
    return type === 'income' ? '+' : '-';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <h2 className="text-2xl font-bold text-gray-900">Gestão de Transações</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Transação
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
            onChange={(e) => setFilter(e.target.value as 'all' | 'income' | 'expense')}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os tipos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas as categorias</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {showForm && (
        <TransactionForm
          transaction={editingTransaction}
          properties={properties}
          onSubmit={editingTransaction ? handleUpdateTransaction : handleAddTransaction}
          onCancel={() => {
            setShowForm(false);
            setEditingTransaction(null);
          }}
        />
      )}

      {/* Lista de Transações */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Propriedade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => {
                const property = properties.find(p => p.id === transaction.propertyId);
                return (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{formatDate(transaction.date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{property?.name || 'Propriedade não encontrada'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Tag className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{transaction.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{transaction.description}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                        <span className={`text-sm font-medium ${getTransactionColor(transaction.type)}`}>
                          {getTransactionIcon(transaction.type)}{showValues ? formatCurrency(transaction.amount) : '****'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditTransaction(transaction)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteTransaction(transaction.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredTransactions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Nenhuma transação encontrada</p>
          <p className="text-gray-400 mt-2">Comece adicionando sua primeira transação</p>
        </div>
      )}
    </div>
  );
};