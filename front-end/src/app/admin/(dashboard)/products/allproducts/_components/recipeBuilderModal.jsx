// src/app/admin/(dashboard)/products/allproducts/_components/recipeBuilderModal.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Select, Tag, Button, InputNumber, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import { useToast } from '@/utils/toast';

import { useGetRecipeByProductQuery, useUpsertRecipeMutation } from '@/services/recipeApi';
import { useGetInventoryItemsQuery } from '@/services/inventoryApi';

export default function RecipeBuilderModal({ open, onClose, product }) {
  const { showSuccess, showError } = useToast();

  const productId = product?._id;
  const { data: recipeData, isLoading: isRecipeLoading } = useGetRecipeByProductQuery(productId, {
    skip: !productId || !open,
  });
  const { data: inventoryItems = [] } = useGetInventoryItemsQuery();
  const [upsertRecipe, { isLoading: isSaving }] = useUpsertRecipeMutation();

  const [ingredients, setIngredients] = useState([]);
  const [prepNotes, setPrepNotes] = useState('');
  const [assemblyTime, setAssemblyTime] = useState(5);

  useEffect(() => {
    if (recipeData && open) {
      if (recipeData.hasRecipe && Array.isArray(recipeData.ingredients)) {
        setIngredients(
          recipeData.ingredients.map((ing) => ({
            inventoryItem: ing._id || ing.inventoryItem?._id || ing.inventoryItem,
            quantityRequired: Number(ing.quantityRequired) || 1,
            yieldPercentage: Number(ing.yieldPercentage) || 100,
            recipeUnit: ing.unit || ing.recipeUnit || ing.inventoryItem?.recipeUnit || 'unit',
            unitCost: ing.unitCost || ing.inventoryItem?.costPerRecipeUnit || 0,
            name: ing.name || ing.inventoryItem?.name || 'Raw Material',
            notes: ing.notes || '',
          }))
        );
      } else {
        setIngredients([]);
      }
      setPrepNotes(recipeData.preparationNotes || '');
      setAssemblyTime(recipeData.assemblyTimeMinutes || 5);
    } else if (open) {
      setIngredients([]);
      setPrepNotes('');
      setAssemblyTime(5);
    }
  }, [recipeData, open]);

  // Dynamic Financial Calculations with Shrinkage Yield Multiplier
  const totalCost = ingredients.reduce((sum, item) => {
    const netQty = Number(item.quantityRequired) || 0;
    const unitPrice = Number(item.unitCost) || 0;
    const yieldPct = Number(item.yieldPercentage) || 100;
    const grossQty = netQty / (yieldPct / 100);
    return sum + grossQty * unitPrice;
  }, 0);

  const productPrice = Number(product?.price) || 0;
  const grossProfit = productPrice - totalCost;
  const marginPercentage = productPrice > 0 ? ((grossProfit / productPrice) * 100).toFixed(1) : 0;

  const handleAddIngredient = () => {
    if (inventoryItems.length === 0) {
      showError('Please register raw inventory items first.');
      return;
    }
    const defaultItem = inventoryItems[0];
    setIngredients((prev) => [
      ...prev,
      {
        inventoryItem: defaultItem._id,
        quantityRequired: 1,
        yieldPercentage: 100,
        recipeUnit: defaultItem.recipeUnit,
        unitCost: defaultItem.costPerRecipeUnit || 0,
        name: defaultItem.name,
        notes: '',
      },
    ]);
  };

  const handleItemChange = (index, selectedItemId) => {
    const matched = inventoryItems.find((i) => i._id === selectedItemId);
    if (!matched) return;

    setIngredients((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        inventoryItem: matched._id,
        recipeUnit: matched.recipeUnit,
        unitCost: matched.costPerRecipeUnit || 0,
        name: matched.name,
      };
      return copy;
    });
  };

  const handleFieldChange = (index, field, val) => {
    setIngredients((prev) => {
      const copy = [...prev];
      copy[index][field] = val;
      return copy;
    });
  };

  const handleRemoveIngredient = (index) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (ingredients.length === 0) {
      showError('Please add at least one ingredient to this recipe.');
      return;
    }

    try {
      await upsertRecipe({
        productId,
        ingredients: ingredients.map((i) => ({
          inventoryItem: i.inventoryItem,
          quantityRequired: Number(i.quantityRequired),
          yieldPercentage: Number(i.yieldPercentage) || 100,
          unit: i.recipeUnit,
          notes: i.notes || '',
        })),
        preparationNotes: prepNotes,
        assemblyTimeMinutes: Number(assemblyTime) || 5,
      }).unwrap();

      showSuccess('Bill of Materials (BOM) & Yield specs saved successfully');
      onClose();
    } catch (err) {
      showError(err?.data?.message || 'Failed to save recipe specification');
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={null}
      centered
      width={780}
      className="font-['Plus_Jakarta_Sans',sans-serif]"
    >
      <div className="pt-2 pb-1">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 m-0">Recipe & BOM Builder</h3>
            <p className="text-xs text-neutral-500 m-0 mt-0.5">
              Menu Item: <strong className="text-neutral-900">{product?.name}</strong> (Selling Price: Rs. {productPrice.toLocaleString()})
            </p>
          </div>
          <Tag color="blue" className="font-bold text-xs uppercase px-2.5 py-0.5 border-none">
            {ingredients.length} Ingredients Linked
          </Tag>
        </div>

        {/* Financial Breakdown Metric Bar */}
        <div className="grid grid-cols-3 gap-3 my-4 p-3.5 bg-neutral-900 text-white rounded-xl">
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
              True Food Cost (COGS)
            </span>
            <span className="text-base font-bold font-mono text-amber-400">
              Rs. {totalCost.toFixed(2)}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
              Gross Profit / Unit
            </span>
            <span className={`text-base font-bold font-mono ${grossProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              Rs. {grossProfit.toFixed(2)}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
              Profit Margin
            </span>
            <span className={`text-base font-bold font-mono ${marginPercentage >= 40 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {marginPercentage}%
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Prep & Assembly Time Controls */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Assembly / Cook Time (Minutes)
              </label>
              <input
                type="number"
                min="0"
                value={assemblyTime}
                onChange={(e) => setAssemblyTime(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-lg border border-neutral-300 bg-white text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:border-[#ffc400]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Kitchen Prep & Assembly Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Toast buns with butter, melt double cheese on grill"
                value={prepNotes}
                onChange={(e) => setPrepNotes(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-neutral-300 bg-white text-xs font-medium text-neutral-900 focus:outline-none focus:border-[#ffc400]"
              />
            </div>
          </div>

          {/* Raw Materials & Yield Inputs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Raw Ingredients & Cooking Yield Factors
              </span>
              <Button
                size="small"
                type="dashed"
                icon={<PlusOutlined />}
                onClick={handleAddIngredient}
                className="!text-xs font-semibold"
              >
                Add Ingredient
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {ingredients.map((item, index) => {
                const netQty = Number(item.quantityRequired) || 0;
                const yieldPct = Number(item.yieldPercentage) || 100;
                const grossQty = netQty / (yieldPct / 100);
                const rowCost = grossQty * (Number(item.unitCost) || 0);

                return (
                  <div
                    key={index}
                    className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 grid grid-cols-12 gap-2 items-center text-xs"
                  >
                    {/* Material Select */}
                    <div className="col-span-4">
                      <Select
                        value={item.inventoryItem}
                        onChange={(val) => handleItemChange(index, val)}
                        className="w-full"
                        showSearch
                        filterOption={(input, opt) => (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                        options={inventoryItems.map((inv) => ({
                          value: inv._id,
                          label: `${inv.name} (Rs. ${inv.costPerRecipeUnit}/${inv.recipeUnit})`,
                        }))}
                      />
                    </div>

                    {/* Net Spec Qty */}
                    <div className="col-span-3">
                      <label className="text-[9px] text-neutral-500 font-bold block mb-0.5">
                        Net Spec ({item.recipeUnit})
                      </label>
                      <InputNumber
                        min={0.001}
                        step={1}
                        value={item.quantityRequired}
                        onChange={(val) => handleFieldChange(index, 'quantityRequired', val)}
                        className="w-full font-mono font-bold text-xs"
                      />
                    </div>

                    {/* Yield % (Cooking Shrinkage) */}
                    <div className="col-span-2">
                      <Tooltip title="100% = No shrink (e.g. buns). 80% = 20% cooking shrinkage (e.g. beef).">
                        <label className="text-[9px] text-neutral-500 font-bold block mb-0.5 cursor-help">
                          Yield % <InfoCircleOutlined className="text-neutral-400" />
                        </label>
                      </Tooltip>
                      <InputNumber
                        min={1}
                        max={100}
                        value={item.yieldPercentage}
                        onChange={(val) => handleFieldChange(index, 'yieldPercentage', val)}
                        className="w-full font-mono font-bold text-xs"
                      />
                    </div>

                    {/* Row Cost */}
                    <div className="col-span-2 text-right">
                      <span className="text-[9px] text-neutral-400 font-bold block">Gross Cost</span>
                      <span className="font-mono font-bold text-neutral-900 text-xs">
                        Rs. {rowCost.toFixed(2)}
                      </span>
                    </div>

                    {/* Delete */}
                    <div className="col-span-1 text-right">
                      <Button
                        size="small"
                        danger
                        type="text"
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveIngredient(index)}
                      />
                    </div>
                  </div>
                );
              })}

              {ingredients.length === 0 && (
                <div className="py-6 text-center text-xs text-neutral-400 border border-dashed border-neutral-300 rounded-lg">
                  No raw materials linked yet. Click &quot;Add Ingredient&quot; to build the recipe.
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
            <CustomButton variant="secondary" type="button" onClick={onClose}>
              Cancel
            </CustomButton>
            <CustomButton variant="primary" htmlType="submit" loading={isSaving || isRecipeLoading}>
              Save Recipe Specifications
            </CustomButton>
          </div>
        </form>
      </div>
    </Modal>
  );
}