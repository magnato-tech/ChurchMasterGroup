
import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Person, Role } from '../types';

export const People: React.FC = () => {
  const { people, addPerson, updatePerson, auth } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Partial<Person> | null>(null);
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('active');

  const filteredPeople = people.filter(p => {
    const matchesSearch = p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterActive === 'all' ? true : (filterActive === 'active' ? p.active : !p.active);
    return matchesSearch && matchesStatus;
  });

  const handleSave = () => {
    if (!editingPerson?.fullName || !editingPerson?.email) return;

    if (editingPerson.id) {
      updatePerson(editingPerson as Person);
    } else {
      addPerson({
        fullName: editingPerson.fullName,
        email: editingPerson.email,
        phone: editingPerson.phone,
        roles: editingPerson.roles || [Role.TEAM_MEMBER],
        active: true
      });
    }
    setShowModal(false);
    setEditingPerson(null);
  };

  const toggleRole = (currentRoles: Role[], roleToToggle: Role) => {
    if (currentRoles.includes(roleToToggle)) {
      // Keep at least one role
      if (currentRoles.length > 1) {
        return currentRoles.filter(r => r !== roleToToggle);
      }
      return currentRoles;
    } else {
      return [...currentRoles, roleToToggle];
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900">Personregister</h2>
          <p className="text-slate-500 mt-1">Administrer organisasjonens medlemmer og frivillige.</p>
        </div>
        {auth.isAdmin && (
          <button 
            onClick={() => { setEditingPerson({ fullName: '', email: '', phone: '', active: true, roles: [Role.TEAM_MEMBER] }); setShowModal(true); }}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95 flex items-center gap-2"
          >
            <span>👤</span> Legg til person
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="relative w-full md:w-96">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input 
              type="text" 
              placeholder="Søk på navn eller e-post..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['all', 'active', 'inactive'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterActive(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${filterActive === f ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {f === 'all' ? 'Alle' : f === 'active' ? 'Aktive' : 'Inaktive'}
              </button>
            ))}
         </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Navn</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Systemroller</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">E-post / Telefon</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase text-center">Status</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase text-right">Handlinger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPeople.map(person => (
                <tr key={person.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                        {person.fullName[0]}
                      </div>
                      <span className="font-bold text-slate-900">{person.fullName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {person.roles.map(r => (
                        <span key={r} className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${r === Role.ADMIN ? 'bg-indigo-100 text-indigo-700' : r === Role.TEAM_LEADER ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-500">{person.email}</p>
                    <p className="text-[10px] text-slate-400">{person.phone || '-'}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${person.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                      {person.active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => { setEditingPerson(person); setShowModal(true); }}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Rediger
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPeople.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">Ingen personer funnet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && editingPerson && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold mb-6 text-slate-900">
              {editingPerson.id ? 'Rediger person' : 'Ny person'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Fullt navn</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingPerson.fullName}
                  onChange={e => setEditingPerson({...editingPerson, fullName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">E-post</label>
                <input 
                  type="email" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingPerson.email}
                  onChange={e => setEditingPerson({...editingPerson, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Telefon</label>
                <input 
                  type="tel" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingPerson.phone}
                  onChange={e => setEditingPerson({...editingPerson, phone: e.target.value})}
                />
              </div>
              
              {/* System Roles Selection - Only for Admins */}
              {auth.isAdmin && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Systemtilgang (Roller)</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.values(Role).map(role => {
                      const isActive = editingPerson.roles?.includes(role);
                      return (
                        <button
                          key={role}
                          onClick={() => setEditingPerson({
                            ...editingPerson,
                            roles: toggleRole(editingPerson.roles || [], role)
                          })}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border transition-all ${
                            isActive 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                            : 'bg-white border-slate-200 text-slate-400 hover:border-blue-300'
                          }`}
                        >
                          {role}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="person-active"
                  className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500"
                  checked={editingPerson.active}
                  onChange={e => setEditingPerson({...editingPerson, active: e.target.checked})}
                />
                <label htmlFor="person-active" className="text-sm font-medium text-slate-700">Aktiv i registeret</label>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 font-bold text-slate-400 hover:text-slate-600">Avbryt</button>
              <button onClick={handleSave} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg active:scale-95">Lagre</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};