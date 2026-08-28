// src/app/admin/(dashboard)/recipes/page.jsx
'use client';

import React, { useState } from 'react';
import { Table, Select, Drawer, Progress, Space } from 'antd';
import {
  PlusOutlined,
  ExperimentOutlined,
  AppstoreOutlined,
  FireOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import PageLayout from '@/app/admin/_components/layout/PageLayout';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import CustomModal from '@/app/admin/_components/modal/CustomModal';
import TableActions from '@/app/admin/_components/table/TableActions';
import {
  useGetAllRecipesQuery,
  useSaveRecipeMutation,
  useProduceSubRecipeBatchMutation,
  useDeleteRecipeMutation,
  useGetInventoryItemsQuery,
} from '@/services/inventoryApi';
import { useGetProductsQuery } from '@/services/productApi';
import { useGetBranchesQuery } from '@/services/branchApi';
import { useToast } from '@/utils/toast';
import { formatPrice } from '@/lib/currency';

const PREP_CATEGORIES = [
  'Sauces & Dressings',
  'Marinades & Seasonings',
  'Bakery & Dough',
  'Sides & Extras',
  'Other',
];

export default function RecipesAndPrepPage() {
  const { contextHolder, showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState('PRODUCT_RECIPES');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Drawers
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [producingRecipe, setProducingRecipe] = useState(null);
  const [batchMultiplier, setBatchMultiplier] = useState(1);
  const [selectedBranch, setSelectedBranch] = useState('');

  // Queries
  const { data: recipes = [], isLoading } = useGetAllRecipesQuery();
  const { data: productsData = [] } = useGetProductsQuery();
  const { data: inventoryData } = useGetInventoryItemsQuery();
  const { data: branches = [] } = useGetBranchesQuery();

  const productsList = Array.isArray(productsData) ? productsData : productsData?.products || [];
  const inventoryItems = inventoryData?.items || [];

  // Mutations
  const [saveRecipe, { isLoading: isSaving }] = useSaveRecipeMutation();
  const [produceBatch, { isLoading: isProducing }] = useProduceSubRecipeBatchMutation();
  const [deleteRecipe] = useDeleteRecipeMutation();

  // Form State
  const [formState, setFormState] = useState({
    type: 'PRODUCT_RECIPE',
    productId: '',
    name: '',
    prepCategory: 'Sauces & Dressings',
    batchYieldQuantity: 1000,
    yieldUnit: 'g',
    outputInventoryItem: '',
    preparationNotes: '',
    assemblyTimeMinutes: 5,
    ingredients: [{ inventoryItem: '', quantityRequired: 1, unit: 'g', notes: '' }],
  });

  const handleOpenCreateDrawer = (type) => {
    setEditingRecipe(null);
    setFormState({
      type,
      productId: productsList[0]?._id || '',
      name: '',
      prepCategory: 'Sauces & Dressings',
      batchYieldQuantity: type === 'SUB_RECIPE_PREP' ? 2000 : 1,
      yieldUnit: 'g',
      outputInventoryItem: '',
      preparationNotes: '',
      assemblyTimeMinutes: 5,
      ingredients: [{ inventoryItem: inventoryItems[0]?._id || '', quantityRequired: 10, unit: 'g', notes: '' }],
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (r) => {
    setEditingRecipe(r);
    setFormState({
      _id: r._id,
      type: r.type,
      productId: r.product?._id || '',
      name: r.name || '',
      prepCategory: r.prepCategory || 'Sauces & Dressings',
      batchYieldQuantity: r.batchYieldQuantity || 1,
      yieldUnit: r.yieldUnit || 'g',
      outputInventoryItem: r.outputInventoryItem?._id || r.outputInventoryItem || '',
      preparationNotes: r.preparationNotes || '',
      assemblyTimeMinutes: r.assemblyTimeMinutes || 5,
      ingredients:
        r.ingredients?.map((i) => ({
          inventoryItem: i._id || i.inventoryItem?._id || i.inventoryItem,
          quantityRequired: i.quantityRequired,
          unit: i.unit,
          notes: i.notes || '',
        })) || [],
    });
    setIsDrawerOpen(true);
  };

  const handleAddIngredientRow = () => {
    setFormState({
      ...formState,
      ingredients: [
        ...formState.ingredients,
        { inventoryItem: inventoryItems[0]?._id || '', quantityRequired: 10, unit: 'g', notes: '' },
      ],
    });
  };

  const handleRemoveIngredientRow = (index) => {
    setFormState({
      ...formState,
      ingredients: formState.ingredients.filter((_, idx) => idx !== index),
    });
  };

  const handleIngredientChange = (index, field, val) => {
    const copy = [...formState.ingredients];
    copy[index][field] = val;

    if (field === 'inventoryItem') {
      const inv = inventoryItems.find((i) => i._id === val);
      if (inv) copy[index].unit = inv.recipeUnit;
    }

    setFormState({ ...formState, ingredients: copy });
  };

  const calculateLiveFormCOGS = () => {
    return formState.ingredients.reduce((sum, line) => {
      const inv = inventoryItems.find((i) => i._id === line.inventoryItem);
      const unitCost = inv?.costPerRecipeUnit || 0;
      return sum + (Number(line.quantityRequired) || 0) * unitCost;
    }, 0);
  };

  const handleSaveRecipeSubmit = async (e) => {
    e.preventDefault();
    if (formState.type === 'SUB_RECIPE_PREP' && !formState.outputInventoryItem) {
      return showError('Please select an inventory item destination to credit batch output.');
    }

    try {
      await saveRecipe(formState).unwrap();
      showSuccess(editingRecipe ? 'Recipe formulation updated.' : 'Recipe registered.');
      setIsDrawerOpen(false);
    } catch (err) {
      showError(err?.data?.message || 'Failed to save recipe');
    }
  };

  const handleExecuteBatchProduction = async () => {
    if (!selectedBranch) return showError('Please select a kitchen outlet.');
    try {
      await produceBatch({
        id: producingRecipe._id,
        branchId: selectedBranch,
        batchMultiplier,
      }).unwrap();
      showSuccess(`Batch produced! Raw ingredients deducted and fresh ${producingRecipe.name} credited.`);
      setProducingRecipe(null);
    } catch (err) {
      showError(err?.data?.message || 'Batch production failed.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteRecipe(id).unwrap();
      showSuccess('Recipe formulation removed.');
    } catch (err) {
      showError(err?.data?.message || 'Failed to delete recipe');
    }
  };

  // Filtered lists
  const productRecipes = recipes.filter(
    (r) => r.type === 'PRODUCT_RECIPE' && (!searchTerm || r.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const subRecipes = recipes.filter(
    (r) => r.type === 'SUB_RECIPE_PREP' && (!searchTerm || r.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Product Recipe Columns
  const productRecipeColumns = [
    {
      title: 'Menu Product',
      dataIndex: 'name',
      key: 'name',
      width: '28%',
      render: (name, r) => (
        <div>
          <span className="font-semibold text-neutral-900 text-xs block">{name}</span>
          <span className="text-[11px] text-neutral-400 font-normal">
            {r.ingredients.length} BOM raw components
          </span>
        </div>
      ),
    },
    {
      title: 'Plate Cost (COGS)',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: '18%',
      render: (cost) => (
        <span className="font-mono font-bold text-xs text-neutral-900">
          {formatPrice(cost)}
        </span>
      ),
    },
    {
      title: 'Selling Price',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      width: '18%',
      render: (price) => (
        <span className="text-xs font-mono font-semibold text-neutral-700">
          {formatPrice(price)}
        </span>
      ),
    },
    {
      title: 'Profit Margin',
      key: 'margin',
      width: '24%',
      render: (_, r) => {
        const isHealthy = r.marginPercent >= 65;
        return (
          <div className="w-36">
            <div className="flex justify-between text-[11px] font-mono font-semibold mb-1">
              <span className={isHealthy ? 'text-emerald-600' : 'text-amber-600'}>
                {r.marginPercent}%
              </span>
              <span className="text-neutral-400 font-normal">+{formatPrice(r.grossMargin)}</span>
            </div>
            <Progress
              percent={Math.min(100, Math.max(0, r.marginPercent))}
              size="small"
              strokeColor={isHealthy ? '#10b981' : '#f59e0b'}
              showInfo={false}
            />
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'action',
      align: 'right',
      width: '12%',
      render: (_, r) => (
        <TableActions
          onEdit={() => handleOpenEditDrawer(r)}
          onDelete={() => handleDelete(r._id)}
          deleteTitle="Delete Product BOM?"
          deleteDescription={`Permanently delete BOM formulation for "${r.name}"? Ingredient auto-deductions will halt.`}
        />
      ),
    },
  ];

  // Sub-Recipe / Sauce Columns
  const subRecipeColumns = [
    {
      title: 'Prep Formulation (Sauce/Marinade)',
      dataIndex: 'name',
      key: 'name',
      width: '32%',
      render: (name, r) => (
        <div>
          <span className="font-semibold text-neutral-900 text-xs block">{name}</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 inline-block mt-1">
            {r.prepCategory}
          </span>
        </div>
      ),
    },
    {
      title: 'Standard Batch Yield',
      key: 'yield',
      width: '22%',
      render: (_, r) => (
        <span className="text-xs font-mono font-semibold text-neutral-800">
          {r.batchYieldQuantity.toLocaleString()} {r.yieldUnit}
        </span>
      ),
    },
    {
      title: 'Batch Costing',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: '26%',
      render: (cost, r) => (
        <div>
          <span className="font-mono font-bold text-xs text-neutral-900 block">
            {formatPrice(cost)}
          </span>
          <span className="text-[11px] text-neutral-400 font-mono">
            (Rs. {r.costPerYieldUnit.toFixed(4)} / {r.yieldUnit})
          </span>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'action',
      align: 'right',
      width: '20%',
      render: (_, r) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => {
              setProducingRecipe(r);
              setBatchMultiplier(1);
              setSelectedBranch(branches[0]?._id || '');
            }}
            className="px-2.5 py-1 text-xs font-bold rounded-lg text-neutral-900 bg-[#F4C61A] hover:bg-[#e5b713] transition cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <FireOutlined className="text-xs" /> Produce
          </button>
          <TableActions
            onEdit={() => handleOpenEditDrawer(r)}
            onDelete={() => handleDelete(r._id)}
            deleteTitle="Archive Sub-Recipe?"
            deleteDescription={`Permanently remove prep formulation for "${r.name}"?`}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <PageLayout
        title="Recipes & Batch Prep"
        subTitle="Product Bill-of-Materials (BOM), in-house sauce formulations, and live COGS margins"
        onAdd={() => handleOpenCreateDrawer(activeTab === 'PRODUCT_RECIPES' ? 'PRODUCT_RECIPE' : 'SUB_RECIPE_PREP')}
        addText={activeTab === 'PRODUCT_RECIPES' ? 'New Product BOM' : 'Create Sub-Recipe'}
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Search recipes or sauces..."
      >
        <div className="space-y-7 font-['Plus_Jakarta_Sans',sans-serif]">
          {/* Custom Pill Tabs */}
          <div className="flex gap-1.5 p-1 bg-neutral-100/80 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('PRODUCT_RECIPES')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'PRODUCT_RECIPES'
                  ? 'bg-white text-neutral-900 shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <AppstoreOutlined className={activeTab === 'PRODUCT_RECIPES' ? 'text-amber-500' : ''} />
              <span>Product Assembly BOM ({productRecipes.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('SUB_RECIPES')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'SUB_RECIPES'
                  ? 'bg-white text-neutral-900 shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <ExperimentOutlined className={activeTab === 'SUB_RECIPES' ? 'text-amber-500' : ''} />
              <span>In-House Sauces & Preps ({subRecipes.length})</span>
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-hidden">
            {activeTab === 'PRODUCT_RECIPES' ? (
              <Table
                columns={productRecipeColumns}
                dataSource={productRecipes}
                rowKey="_id"
                loading={isLoading}
                pagination={{ pageSize: 8 }}
                size="middle"
              />
            ) : (
              <Table
                columns={subRecipeColumns}
                dataSource={subRecipes}
                rowKey="_id"
                loading={isLoading}
                pagination={{ pageSize: 8 }}
                size="middle"
              />
            )}
          </div>
        </div>

        {/* DRAWER: Create / Edit Formulation */}
        <Drawer
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          size={560}
          title={
            <span className="text-sm font-bold text-neutral-900">
              {editingRecipe
                ? `Edit Recipe: ${formState.name || 'BOM'}`
                : formState.type === 'PRODUCT_RECIPE'
                ? 'New Product BOM Formulation'
                : 'Create In-House Prep Formulation'}
            </span>
          }
          className="font-['Plus_Jakarta_Sans',sans-serif]"
        >
          <form onSubmit={handleSaveRecipeSubmit} className="space-y-4">
            {formState.type === 'PRODUCT_RECIPE' ? (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Menu Product <span className="text-red-500">*</span>
                </label>
                <Select
                  className="w-full h-10 staff-modern-select"
                  value={formState.productId || undefined}
                  onChange={(val) => setFormState({ ...formState, productId: val })}
                  options={productsList.map((p) => ({
                    value: p._id,
                    label: `${p.name} (${formatPrice(p.price)})`,
                  }))}
                  placeholder="Select Product"
                />
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Sauce / Prep Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. House Chipotle Sauce"
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-900 focus:outline-none focus:border-[#F4C61A] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Category
                    </label>
                    <Select
                      className="w-full h-10 staff-modern-select"
                      value={formState.prepCategory}
                      onChange={(val) => setFormState({ ...formState, prepCategory: val })}
                      options={PREP_CATEGORIES.map((c) => ({ value: c, label: c }))}
                    />
                  </div>
                </div>

                {/* Target Stock Item Selector to Credit Output */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Credit Yield To Inventory Item <span className="text-red-500">*</span>
                  </label>
                  <Select
                    className="w-full h-10 staff-modern-select"
                    value={formState.outputInventoryItem || undefined}
                    onChange={(val) => setFormState({ ...formState, outputInventoryItem: val })}
                    options={inventoryItems.map((inv) => ({
                      value: inv._id,
                      label: `${inv.name} (${inv.sku || 'SKU'} • ${inv.recipeUnit})`,
                    }))}
                    placeholder="Select inventory stock item to deposit produced batch"
                  />
                  <span className="text-[11px] text-neutral-400 block mt-1">
                    When this batch is produced, inventory stock for this item will automatically increase.
                  </span>
                </div>
              </div>
            )}

            {formState.type === 'SUB_RECIPE_PREP' && (
              <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Standard Batch Output</label>
                  <input
                    type="number"
                    min={1}
                    value={formState.batchYieldQuantity}
                    onChange={(e) => setFormState({ ...formState, batchYieldQuantity: Number(e.target.value) || 1000 })}
                    className="w-full h-9 px-2.5 rounded-xl border border-neutral-200 bg-white font-mono font-bold text-xs text-neutral-900 focus:outline-none focus:border-[#F4C61A]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Yield Unit</label>
                  <select
                    value={formState.yieldUnit}
                    onChange={(e) => setFormState({ ...formState, yieldUnit: e.target.value })}
                    className="w-full h-9 px-2.5 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-900 focus:outline-none focus:border-[#F4C61A] cursor-pointer"
                  >
                    {['g', 'ml', 'piece', 'portion'].map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Dynamic Ingredient Table */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-neutral-800">
                  Raw Ingredients Required
                </span>
                <button
                  type="button"
                  onClick={handleAddIngredientRow}
                  className="text-xs font-semibold text-neutral-700 hover:text-black flex items-center gap-1 cursor-pointer"
                >
                  <PlusOutlined className="text-[10px]" /> Add Item
                </button>
              </div>

              <div className="space-y-2">
                {formState.ingredients.map((line, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-white p-2.5 rounded-xl border border-neutral-200">
                    <div className="flex-1">
                      <Select
                        className="w-full h-9 staff-modern-select"
                        value={line.inventoryItem || undefined}
                        onChange={(val) => handleIngredientChange(idx, 'inventoryItem', val)}
                        options={inventoryItems.map((inv) => ({
                          value: inv._id,
                          label: `${inv.name} (Rs. ${inv.costPerRecipeUnit || 0}/${inv.recipeUnit})`,
                        }))}
                        placeholder="Pick raw item"
                      />
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        min={0.01}
                        step="any"
                        placeholder="Qty"
                        value={line.quantityRequired}
                        onChange={(e) => handleIngredientChange(idx, 'quantityRequired', Number(e.target.value) || 1)}
                        className="w-full h-9 px-2.5 border border-neutral-200 rounded-xl bg-white font-mono font-bold text-xs text-neutral-900 focus:outline-none focus:border-[#F4C61A]"
                      />
                    </div>
                    <span className="text-xs font-semibold text-neutral-500 w-8">{line.unit}</span>
                    {formState.ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredientRow(idx)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      >
                        <DeleteOutlined className="text-xs" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-neutral-200/60 flex justify-between items-center text-xs">
                <span className="text-neutral-500 font-medium">Calculated COGS:</span>
                <span className="text-base font-bold font-mono text-neutral-900">
                  {formatPrice(calculateLiveFormCOGS())}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Preparation & Assembly Notes
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Toast bun on flat top for 45s, apply 25g sauce on top crown"
                value={formState.preparationNotes}
                onChange={(e) => setFormState({ ...formState, preparationNotes: e.target.value })}
                className="w-full p-3 rounded-xl border border-neutral-200 bg-white text-xs font-normal text-neutral-900 focus:outline-none focus:border-[#F4C61A] transition"
              />
            </div>

            <div className="flex justify-end pt-3 mt-4 border-t border-neutral-100">
              <Space size="middle">
                <CustomButton variant="secondary" type="button" onClick={() => setIsDrawerOpen(false)}>
                  Cancel
                </CustomButton>
                <CustomButton variant="primary" htmlType="submit" loading={isSaving}>
                  Save Formulation
                </CustomButton>
              </Space>
            </div>
          </form>
        </Drawer>

        {/* MODAL: Produce Batch (Sauce Preparation) */}
        <CustomModal
          open={!!producingRecipe}
          onCancel={() => setProducingRecipe(null)}
          title={`Produce Batch: ${producingRecipe?.name || ''}`}
          width={440}
        >
          {producingRecipe && (
            <div className="mt-4 space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
              <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/60 flex items-start gap-2.5">
                <FireOutlined className="text-amber-600 mt-0.5" />
                <p className="text-xs text-amber-900 m-0 leading-relaxed font-normal">
                  Preparing this batch will deduct raw condiments from the chosen branch and credit fresh <strong className="font-semibold">{producingRecipe.name}</strong> inventory.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Preparation Kitchen Outlet <span className="text-red-500">*</span>
                </label>
                <Select
                  className="w-full h-10 staff-modern-select"
                  value={selectedBranch}
                  onChange={(val) => setSelectedBranch(val)}
                  options={branches.map((b) => ({ value: b._id, label: `${b.name} (${b.city})` }))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Batch Multiplier
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={batchMultiplier}
                  onChange={(e) => setBatchMultiplier(Number(e.target.value) || 1)}
                  className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 bg-white font-mono font-bold text-xs text-neutral-900 focus:outline-none focus:border-[#F4C61A]"
                />
                <span className="text-[11px] text-neutral-400 mt-1 block">
                  = {(producingRecipe.batchYieldQuantity * batchMultiplier).toLocaleString()} {producingRecipe.yieldUnit} of sauce produced
                </span>
              </div>

              <div className="flex justify-end pt-3 mt-4 border-t border-neutral-100">
                <Space size="middle">
                  <CustomButton variant="secondary" type="button" onClick={() => setProducingRecipe(null)}>
                    Cancel
                  </CustomButton>
                  <CustomButton variant="primary" loading={isProducing} onClick={handleExecuteBatchProduction}>
                    Confirm & Deduct Stock
                  </CustomButton>
                </Space>
              </div>
            </div>
          )}
        </CustomModal>
      </PageLayout>
    </>
  );
}