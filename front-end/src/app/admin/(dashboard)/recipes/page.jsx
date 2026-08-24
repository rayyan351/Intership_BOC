// src/app/admin/(dashboard)/recipes/page.jsx
'use client';

import React, { useState } from 'react';
import {
  Table,
  Tag,
  Button,
  Modal,
  Drawer,
  Input,
  InputNumber,
  Select,
  Row,
  Col,
  Tabs,
  Popconfirm,
  Progress,
} from 'antd';
import {
  PlusOutlined,
  ExperimentOutlined,
  AppstoreOutlined,
  FireOutlined,
  DollarCircleOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import PageLayout from '@/app/admin/_components/layout/PageLayout';
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
  const [activeTab, setActiveTab] = useState('PRODUCT_RECIPES'); // 'PRODUCT_RECIPES' | 'SUB_RECIPES'
  const [searchTerm, setSearchTerm] = useState('');

  // Drawers & Modals
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
      outputInventoryItem: r.outputInventoryItem?._id || '',
      preparationNotes: r.preparationNotes || '',
      assemblyTimeMinutes: r.assemblyTimeMinutes || 5,
      ingredients: r.ingredients?.map((i) => ({
        inventoryItem: i._id,
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
    try {
      await saveRecipe(formState).unwrap();
      showSuccess(editingRecipe ? 'Recipe formulation updated.' : 'Recipe registered.');
      setIsDrawerOpen(false);
    } catch (err) {
      showError(err?.data?.message || 'Failed to save recipe');
    }
  };

  const handleExecuteBatchProduction = async () => {
    if (!selectedBranch) return showError('Please select a branch outlet.');
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

  // Filtered lists
  const productRecipes = recipes.filter((r) => r.type === 'PRODUCT_RECIPE' && (!searchTerm || r.name?.toLowerCase().includes(searchTerm.toLowerCase())));
  const subRecipes = recipes.filter((r) => r.type === 'SUB_RECIPE_PREP' && (!searchTerm || r.name?.toLowerCase().includes(searchTerm.toLowerCase())));

  // Product Recipe Columns
  const productRecipeColumns = [
    {
      title: 'Menu Product',
      dataIndex: 'name',
      key: 'name',
      render: (name, r) => (
        <div>
          <strong className="text-xs text-neutral-900 block">{name}</strong>
          <span className="text-[10px] text-neutral-400 font-mono">
            {r.ingredients.length} BOM components
          </span>
        </div>
      ),
    },
    {
      title: 'Plate Cost (COGS)',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (cost) => <strong className="text-xs font-mono text-neutral-900">{formatPrice(cost)}</strong>,
    },
    {
      title: 'Selling Price',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      render: (price) => <span className="text-xs font-mono font-bold text-neutral-700">{formatPrice(price)}</span>,
    },
    {
      title: 'Profit Margin',
      key: 'margin',
      render: (_, r) => {
        const isHealthy = r.marginPercent >= 65;
        return (
          <div className="w-36">
            <div className="flex justify-between text-[11px] font-mono font-bold mb-0.5">
              <span className={isHealthy ? 'text-emerald-600' : 'text-amber-600'}>
                {r.marginPercent}%
              </span>
              <span className="text-neutral-500 font-normal">+{formatPrice(r.grossMargin)}</span>
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
      title: 'Action',
      key: 'action',
      align: 'right',
      render: (_, r) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="small" type="text" icon={<EditOutlined />} onClick={() => handleOpenEditDrawer(r)} />
          <Popconfirm
            title="Delete this product BOM recipe?"
            onConfirm={() => deleteRecipe(r._id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true, size: 'small' }}
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  // Sub-Recipe / Sauce Columns
  const subRecipeColumns = [
    {
      title: 'Prep Formulation (Sauce/Marinade)',
      dataIndex: 'name',
      key: 'name',
      render: (name, r) => (
        <div>
          <strong className="text-xs text-neutral-900 block">{name}</strong>
          <Tag className="text-[9px] font-bold border-none bg-neutral-100 mt-0.5">{r.prepCategory}</Tag>
        </div>
      ),
    },
    {
      title: 'Standard Batch Yield',
      key: 'yield',
      render: (_, r) => (
        <span className="text-xs font-mono font-bold text-neutral-800">
          {r.batchYieldQuantity.toLocaleString()} {r.yieldUnit}
        </span>
      ),
    },
    {
      title: 'Total Batch Cost',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (cost, r) => (
        <div>
          <strong className="text-xs font-mono text-neutral-900 block">{formatPrice(cost)}</strong>
          <span className="text-[10px] text-neutral-400 font-mono">
            (Rs. {r.costPerYieldUnit.toFixed(4)} / {r.yieldUnit})
          </span>
        </div>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right',
      render: (_, r) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="small"
            type="primary"
            icon={<FireOutlined />}
            onClick={() => {
              setProducingRecipe(r);
              setBatchMultiplier(1);
              setSelectedBranch(branches[0]?._id || '');
            }}
            className="!bg-amber-500 hover:!bg-amber-600 text-black font-bold text-[11px] border-none flex items-center gap-1"
          >
            Produce Batch
          </Button>
          <Button size="small" type="text" icon={<EditOutlined />} onClick={() => handleOpenEditDrawer(r)} />
          <Popconfirm
            title="Archive this sub-recipe?"
            onConfirm={() => deleteRecipe(r._id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true, size: 'small' }}
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
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
        addText={activeTab === 'PRODUCT_RECIPES' ? 'New Product BOM' : 'Create Sauce / Sub-Recipe'}
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Search recipes or sauces..."
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'PRODUCT_RECIPES',
              label: (
                <span className="flex items-center gap-2 font-bold text-xs">
                  <AppstoreOutlined /> Menu Product Assembly ({productRecipes.length})
                </span>
              ),
              children: (
                <Table
                  columns={productRecipeColumns}
                  dataSource={productRecipes}
                  rowKey="_id"
                  loading={isLoading}
                  pagination={{ pageSize: 8 }}
                  size="middle"
                />
              ),
            },
            {
              key: 'SUB_RECIPES',
              label: (
                <span className="flex items-center gap-2 font-bold text-xs">
                  <ExperimentOutlined /> In-House Sauces & Batch Preps ({subRecipes.length})
                </span>
              ),
              children: (
                <Table
                  columns={subRecipeColumns}
                  dataSource={subRecipes}
                  rowKey="_id"
                  loading={isLoading}
                  pagination={{ pageSize: 8 }}
                  size="middle"
                />
              ),
            },
          ]}
        />

        {/* DRAWER: Create / Edit Formulation */}
        <Drawer
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          size={540}
          title={
            editingRecipe
              ? `Edit Recipe: ${formState.name || 'BOM'}`
              : formState.type === 'PRODUCT_RECIPE'
              ? 'New Product BOM Formulation'
              : 'Create In-House Sauce / Prep Formulation'
          }
          className="font-['Plus_Jakarta_Sans',sans-serif]"
        >
          <form onSubmit={handleSaveRecipeSubmit} className="space-y-4">
            {formState.type === 'PRODUCT_RECIPE' ? (
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Menu Product *
                </label>
                <Select
                  className="w-full h-10"
                  value={formState.productId || undefined}
                  onChange={(val) => setFormState({ ...formState, productId: val })}
                  options={productsList.map((p) => ({ value: p._id, label: `${p.name} (${formatPrice(p.price)})` }))}
                  placeholder="Select Product"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Sauce / Prep Name *
                  </label>
                  <Input
                    required
                    placeholder="e.g. House Chipotle Sauce"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    className="h-10 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <Select
                    className="w-full h-10"
                    value={formState.prepCategory}
                    onChange={(val) => setFormState({ ...formState, prepCategory: val })}
                    options={PREP_CATEGORIES.map((c) => ({ value: c, label: c }))}
                  />
                </div>
              </div>
            )}

            {formState.type === 'SUB_RECIPE_PREP' && (
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">Standard Batch Output</label>
                  <InputNumber
                    className="w-full"
                    min={1}
                    value={formState.batchYieldQuantity}
                    onChange={(val) => setFormState({ ...formState, batchYieldQuantity: val || 1000 })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">Yield Unit</label>
                  <Select
                    className="w-full"
                    value={formState.yieldUnit}
                    onChange={(val) => setFormState({ ...formState, yieldUnit: val })}
                    options={['g', 'ml', 'piece', 'portion'].map((u) => ({ value: u, label: u }))}
                  />
                </div>
              </div>
            )}

            {/* Dynamic Ingredient Table */}
            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-neutral-900 uppercase tracking-wider">
                  Raw Ingredients Required
                </span>
                <Button size="small" type="link" icon={<PlusOutlined />} onClick={handleAddIngredientRow} className="text-xs font-bold">
                  Add Ingredient
                </Button>
              </div>

              <div className="space-y-2">
                {formState.ingredients.map((line, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded-xl border border-neutral-200">
                    <div className="flex-1">
                      <Select
                        className="w-full"
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
                      <InputNumber
                        className="w-full"
                        min={0.01}
                        placeholder="Qty"
                        value={line.quantityRequired}
                        onChange={(val) => handleIngredientChange(idx, 'quantityRequired', val || 1)}
                      />
                    </div>
                    <span className="text-xs font-bold text-neutral-500 w-8">{line.unit}</span>
                    {formState.ingredients.length > 1 && (
                      <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemoveIngredientRow(idx)} />
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-neutral-200 flex justify-between items-center text-xs font-bold">
                <span>Calculated COGS:</span>
                <strong className="text-sm font-black font-mono text-neutral-900">
                  {formatPrice(calculateLiveFormCOGS())}
                </strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Preparation & Assembly Notes
              </label>
              <Input.TextArea
                rows={2}
                placeholder="e.g. Toast bun on flat top for 45s, apply 25g sauce on top crown"
                value={formState.preparationNotes}
                onChange={(e) => setFormState({ ...formState, preparationNotes: e.target.value })}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="pt-4 border-t border-neutral-100 flex gap-2 justify-end">
              <Button onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={isSaving} className="!bg-[#ffc400] !text-black font-bold border-none">
                Save Recipe Specification
              </Button>
            </div>
          </form>
        </Drawer>

        {/* MODAL: Produce Batch (Sauce Preparation) */}
        <Modal
          open={!!producingRecipe}
          onCancel={() => setProducingRecipe(null)}
          footer={null}
          title={null}
          centered
          size={420}
          className="font-['Plus_Jakarta_Sans',sans-serif]"
        >
          {producingRecipe && (
            <div className="pt-2">
              <h3 className="text-base font-black text-neutral-900 uppercase tracking-wide mb-1 flex items-center gap-2">
                <FireOutlined className="text-amber-500" />
                Produce Batch: {producingRecipe.name}
              </h3>
              <p className="text-xs text-neutral-500 mb-4">
                Cook and mix sauce batch. Raw condiments will be automatically deducted from inventory.
              </p>

              <div className="space-y-3 mb-5">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Preparation Kitchen Outlet *
                  </label>
                  <Select
                    className="w-full h-10"
                    value={selectedBranch}
                    onChange={(val) => setSelectedBranch(val)}
                    options={branches.map((b) => ({ value: b._id, label: `${b.name} (${b.city})` }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Batch Multiplier
                  </label>
                  <InputNumber
                    className="w-full h-10 flex items-center"
                    min={1}
                    max={20}
                    value={batchMultiplier}
                    onChange={(val) => setBatchMultiplier(val || 1)}
                  />
                  <span className="text-[11px] text-neutral-400 mt-1 block">
                    = {(producingRecipe.batchYieldQuantity * batchMultiplier).toLocaleString()} {producingRecipe.yieldUnit} of sauce produced
                  </span>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-neutral-100">
                <Button onClick={() => setProducingRecipe(null)}>Cancel</Button>
                <Button
                  type="primary"
                  loading={isProducing}
                  onClick={handleExecuteBatchProduction}
                  className="!bg-amber-500 hover:!bg-amber-600 text-black font-bold border-none"
                >
                  Confirm & Deduct Stock
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </PageLayout>
    </>
  );
}