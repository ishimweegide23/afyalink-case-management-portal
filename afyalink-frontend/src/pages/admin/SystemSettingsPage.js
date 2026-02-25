import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { systemSettingApi } from '../../api/systemSettingApi';
import { usePagination } from '../../hooks/usePagination';
import { useSearch } from '../../hooks/useSearch';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Spinner from '../../components/common/Spinner';
import PageHeader from '../../components/layout/PageHeader';
import {
  HiOutlinePencil,
  HiOutlineCog,
  HiOutlineOfficeBuilding,
  HiOutlineShieldCheck,
  HiOutlineBell,
  HiOutlineMail,
  HiOutlineDatabase,
  HiOutlinePuzzle,
  HiOutlineColorSwatch,
  HiOutlineGlobeAlt,
  HiOutlineViewList,
  HiOutlineSave,
} from 'react-icons/hi';

const CATEGORIES = [
  { id: 'organization', label: 'Organization', icon: HiOutlineOfficeBuilding, desc: 'Organization name, short name, and branding' },
  { id: 'security', label: 'Security', icon: HiOutlineShieldCheck, desc: 'Password policy, session timeout, and security options' },
  { id: 'notifications', label: 'Notifications', icon: HiOutlineBell, desc: 'Default notification channels and templates' },
  { id: 'email', label: 'Email', icon: HiOutlineMail, desc: 'SMTP and email sending configuration' },
  { id: 'data', label: 'Data', icon: HiOutlineDatabase, desc: 'Backup, retention, and data policies' },
  { id: 'integration', label: 'Integration', icon: HiOutlinePuzzle, desc: 'External APIs and third-party integrations' },
  { id: 'appearance', label: 'Appearance', icon: HiOutlineColorSwatch, desc: 'Theme, logo, and display options' },
  { id: 'localization', label: 'Localization', icon: HiOutlineGlobeAlt, desc: 'Language, timezone, and date format' },
  { id: '_all', label: 'All settings', icon: HiOutlineViewList, desc: 'View and edit all keys (raw)' },
];

function keyToLabel(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState('organization');
  const [categoryData, setCategoryData] = useState({});
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editSetting, setEditSetting] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const { keyword, debouncedKeyword, handleSearch } = useSearch();
  const pagination = usePagination();

  const fetchCategory = useCallback(async (category) => {
    if (!category || category === '_all') return;
    setCategoryLoading(true);
    try {
      const res = await systemSettingApi.getCategory(category);
      const data = res?.data ?? res;
      setCategoryData((prev) => ({ ...prev, [category]: data && typeof data === 'object' ? data : {} }));
    } catch {
      toast.error('Failed to load category settings');
      setCategoryData((prev) => ({ ...prev, [category]: {} }));
    } finally {
      setCategoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab && activeTab !== '_all') fetchCategory(activeTab);
  }, [activeTab, fetchCategory]);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = debouncedKeyword
        ? await systemSettingApi.search({ keyword: debouncedKeyword, page: pagination.page, size: pagination.size })
        : await systemSettingApi.getAll({ page: pagination.page, size: pagination.size });
      const data = res?.data ?? res;
      setSettings(data?.content || []);
      pagination.updateFromResponse(data);
    } catch {
      toast.error('Failed to load settings');
      setSettings([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedKeyword, pagination.page, pagination.size]);

  useEffect(() => {
    if (activeTab === '_all') fetchSettings();
  }, [activeTab, fetchSettings]);

  const handleSaveCategory = async () => {
    if (activeTab === '_all' || !activeTab) return;
    setCategorySaving(true);
    try {
      const payload = categoryData[activeTab];
      if (!payload || typeof payload !== 'object') {
        toast.info('No changes to save');
        return;
      }
      const res = await systemSettingApi.updateCategory(activeTab, payload);
      const data = res?.data ?? res;
      setCategoryData((prev) => ({ ...prev, [activeTab]: data || {} }));
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err?.message || 'Failed to save settings');
    } finally {
      setCategorySaving(false);
    }
  };

  const handleCategoryChange = (key, value) => {
    if (activeTab === '_all') return;
    setCategoryData((prev) => ({
      ...prev,
      [activeTab]: { ...(prev[activeTab] || {}), [key]: value },
    }));
  };

  const handleSaveEdit = async () => {
    try {
      await systemSettingApi.updateByKey(editSetting.key, editValue);
      toast.success('Setting updated');
      setEditSetting(null);
      fetchSettings();
    } catch {
      toast.error('Failed to update setting');
    }
  };

  const columns = [
    { key: 'key', header: 'Key', render: (v) => <span className="font-mono text-sm font-medium text-gray-900">{v}</span> },
    { key: 'value', header: 'Value', render: (v) => <span className="text-gray-600 max-w-md truncate block">{v}</span> },
    { key: 'category', header: 'Category', render: (v) => v || '—' },
    {
      key: 'actions',
      header: '',
      render: (_, row) => (
        <button
          onClick={() => { setEditSetting(row); setEditValue(row.value ?? ''); }}
          className="p-1.5 hover:bg-primary-50 rounded-lg text-primary"
          title="Edit"
        >
          <HiOutlinePencil className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const isAllTab = activeTab === '_all';
  const data = categoryData[activeTab];
  const dataKeys = data && typeof data === 'object' ? Object.keys(data) : [];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        badge="System Settings"
        badgeIcon={HiOutlineCog}
        title="System Settings"
        subtitle="Manage application configuration"
      />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          <nav className="lg:w-56 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 p-2">
            <ul className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeTab === cat.id;
                return (
                  <li key={cat.id}>
                    <button
                      type="button"
                      onClick={() => setActiveTab(cat.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-colors whitespace-nowrap ${
                        isActive ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {cat.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex-1 min-w-0 p-6">
            {isAllTab ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <SearchBar value={keyword} onChange={handleSearch} placeholder="Search settings..." className="max-w-sm" />
                  {!loading && settings.length > 0 && (
                    <p className="text-sm text-gray-500">{pagination.totalElements} setting{pagination.totalElements !== 1 ? 's' : ''}</p>
                  )}
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <Table
                  columns={columns}
                  data={settings}
                  loading={loading}
                  emptyMessage="No system settings in the database yet. Use category tabs to add settings, or they will appear here once created."
                />
                {!loading && settings.length > 0 && (
                  <Pagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    totalElements={pagination.totalElements}
                    onPageChange={pagination.goToPage}
                    className="mt-4"
                  />
                )}
                </div>
              </>
            ) : (
              <>
                {CATEGORIES.find((c) => c.id === activeTab) && (
                  <div className="mb-6">
                    <p className="text-gray-500 text-sm">
                      {CATEGORIES.find((c) => c.id === activeTab)?.desc}
                    </p>
                  </div>
                )}
                {categoryLoading ? (
                  <div className="flex justify-center py-16"><Spinner size="lg" /></div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                    {dataKeys.length === 0 ? (
                      <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-8">
                        <HiOutlineCog className="w-12 h-12 text-gray-300 mx-auto mb-3 block" />
                        <p className="text-gray-500 text-sm text-center">No settings in this category yet.</p>
                        <p className="text-gray-400 text-xs mt-1 text-center">Add a key and value, then click Add and Save below.</p>
                        <div className="mt-6 max-w-md mx-auto space-y-4">
                          <Input
                            label="Key (e.g. organizationName)"
                            placeholder="e.g. organizationName"
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value.trim().replace(/\s+/g, '_'))}
                          />
                          <Input
                            label="Value"
                            placeholder="e.g. AfyaLink"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (newKey) {
                                setCategoryData((prev) => ({ ...prev, [activeTab]: { ...(prev[activeTab] || {}), [newKey]: newValue } }));
                                setNewKey('');
                                setNewValue('');
                              }
                            }}
                          >
                            Add setting
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {dataKeys.map((key) => {
                          const val = data[key];
                          const isBool = typeof val === 'boolean';
                          const isNum = typeof val === 'number';
                          return (
                            <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                              <label className="sm:w-48 text-sm font-medium text-gray-700 shrink-0">
                                {keyToLabel(key)}
                              </label>
                              {isBool ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={!!val}
                                    onChange={(e) => handleCategoryChange(key, e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                  />
                                  <span className="text-sm text-gray-500">{val ? 'On' : 'Off'}</span>
                                </div>
                              ) : (
                                <input
                                  type={isNum ? 'number' : 'text'}
                                  value={val ?? ''}
                                  onChange={(e) => handleCategoryChange(key, isNum ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
                                  className="flex-1 max-w-md px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {!categoryLoading && (
                      <div className="pt-4 border-t border-gray-100">
                        <Button onClick={handleSaveCategory} loading={categorySaving} disabled={categoryLoading}>
                          <HiOutlineSave className="w-4 h-4 mr-2" />
                          Save {CATEGORIES.find((c) => c.id === activeTab)?.label} settings
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!editSetting}
        onClose={() => setEditSetting(null)}
        title={editSetting ? `Edit: ${editSetting.key}` : ''}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditSetting(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </>
        }
      >
        {editSetting && (
          <Input
            label="Value"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
          />
        )}
      </Modal>
    </div>
  );
}
