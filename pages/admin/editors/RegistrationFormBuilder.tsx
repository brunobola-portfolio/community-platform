
import React from 'react';
import { Plus, Trash2, FormInput } from 'lucide-react';
import { Button } from '../../../components/ui/UIComponents';
import { AdminSelect } from '../components/AdminSelect';
import { RegistrationFieldDefinition } from '../../../types';

export interface RegistrationFormBuilderProps {
    fields: RegistrationFieldDefinition[];
    onChange: (fields: RegistrationFieldDefinition[]) => void;
}

export const RegistrationFormBuilder: React.FC<RegistrationFormBuilderProps> = ({ fields, onChange }) => {
    const addField = () => {
        const newField: RegistrationFieldDefinition = {
            id: `field_${Date.now()}`,
            label: 'Novo Campo',
            type: 'text',
            required: false,
            placeholder: ''
        };
        onChange([...fields, newField]);
    };

    const updateField = (idx: number, updates: Partial<RegistrationFieldDefinition>) => {
        const newFields = [...fields];
        newFields[idx] = { ...newFields[idx], ...updates };
        onChange(newFields);
    };

    const removeField = (idx: number) => {
        onChange(fields.filter((_, i) => i !== idx));
    };

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2"><FormInput size={16} /> Campos do Formulário</h4>
                <Button type="button" size="sm" variant="ghost" className="h-8 border-dashed border-slate-600" onClick={addField}>
                    <Plus size={14} className="mr-1" /> Adicionar Campo
                </Button>
            </div>

            {fields.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs italic border border-dashed border-slate-800 rounded-lg">
                    Sem campos definidos. O formulário pedirá apenas Email.
                </div>
            ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                    {fields.map((field, idx) => (
                        <div key={field.id} className="flex gap-2 items-start bg-black/20 p-3 rounded-lg border border-white/5 group hover:border-brand-500/30 transition-colors">
                            <div className="grid grid-cols-12 gap-2 flex-1">
                                <div className="col-span-4">
                                    <input
                                        value={field.label}
                                        onChange={e => updateField(idx, { label: e.target.value })}
                                        className="w-full bg-transparent text-xs text-white border-b border-slate-700 focus:border-brand-500 outline-none"
                                        placeholder="Label"
                                    />
                                </div>
                                <div className="col-span-3">
                                    <AdminSelect
                                        value={field.type}
                                        onChange={e => updateField(idx, { type: e.target.value as RegistrationFieldDefinition['type'] })}
                                        aria-label="Tipo de campo"
                                        className="bg-slate-800 text-xs text-slate-300 border-none rounded py-1 pl-2 pr-6"
                                    >
                                        <option value="text">Texto</option>
                                        <option value="email">Email</option>
                                        <option value="phone">Tel</option>
                                        <option value="number">Núm</option>
                                        <option value="date">Data</option>
                                        <option value="textarea">Área</option>
                                    </AdminSelect>
                                </div>
                                <div className="col-span-3">
                                    <input
                                        value={field.placeholder || ''}
                                        onChange={e => updateField(idx, { placeholder: e.target.value })}
                                        className="w-full bg-transparent text-xs text-slate-400 border-b border-slate-700 focus:border-brand-500 outline-none"
                                        placeholder="Placeholder"
                                    />
                                </div>
                                <div className="col-span-2 flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        checked={field.required}
                                        onChange={e => updateField(idx, { required: e.target.checked })}
                                        className="accent-brand-500 w-4 h-4"
                                    />
                                </div>
                            </div>
                            <button type="button" onClick={() => removeField(idx)} className="text-slate-600 hover:text-red-400 p-1">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
