// src/app/admin/(dashboard)/products/allproducts/_components/recipeBuilderModal.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Select, Tag, Button } from 'antd'; // <-- Add Button here
import { PlusOutlined, DeleteOutlined, CalculatorOutlined } from '@ant-design/icons';
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
            inventoryItem: ing._id,
            quantityRequired: ing.quantityRequired,
            recipeUnit: ing.recipeUnit,
            unitCost: ing.unitCost,
            name: ing.name,
            notes: ing.notes || '',
          }))
        );
      } else {
        setIngredients([]);
      }
      setPrepNotes(recipeData.preparationNotes || '');
      setAssemblyTime(recipeData.assemblyTimeMinutes || 5);
    }
  }, [recipeData, open]);

  // Dynamic Financial Calculations
  const totalCost = ingredients.reduce((sum, item) => {
    return sum + (Number(item.quantityRequired) || 0) * (Number(item.unitCost) || 0);
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

  const handleQuantityChange = (index, qty) => {
    setIngredients((prev) => {
      const copy = [...prev];
      copy[index].quantityRequired = Number(qty);
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
          quantityRequired: i.quantityRequired,
          notes: i.notes || '',
        })),
        preparationNotes: prepNotes,
        assemblyTimeMinutes: assemblyTime,
      }).unwrap();

      showSuccess('Bill of Materials (BOM) saved successfully');
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
      width={720}
      className="font-['Plus_Jakarta_Sans',sans-serif]"
    >
      <div className="pt-2 pb-1">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 m-0">Recipe & BOM Builder</h3>
            <p className="text-xs text-neutral-500 m-0 mt-0.5">
              Menu Item: <strong className="text-neutral-900">{product?.name}</strong> (Selling Price: Rs. {productPrice})
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
              Total Cost (COGS)
            </span>
            <span className="text-base font-bold font-mono text-amber-400">
              Rs. {totalCost.toFixed(2)}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
              Gross Profit / Item
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
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Required Raw Materials
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
                const rowCost = (Number(item.quantityRequired) || 0) * (Number(item.unitCost) || 0);

                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 text-xs"
                  >
                    <div className="flex-1">
                      <Select
                        value={item.inventoryItem}
                        onChange={(val) => handleItemChange(index, val)}
                        className="w-full"
                        options={inventoryItems.map((inv) => ({
                          value: inv._id,
                          label: `${inv.name} (Rs. ${inv.costPerRecipeUnit}/${inv.recipeUnit})`,
                        }))}
                      />
                    </div>

                    <div className="w-28 flex items-center">
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        value={item.quantityRequired}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        className="w-full h-8 px-2 border border-neutral-300 rounded bg-white text-xs font-bold font-mono text-neutral-900 focus:outline-none focus:border-[#ffc400]"
                        required
                      />
                      <span className="ml-1 text-[11px] font-bold text-neutral-500 w-8">
                        {item.recipeUnit}
                      </span>
                    </div>

                    <div className="w-24 text-right font-mono font-bold text-neutral-800">
                      Rs. {rowCost.toFixed(2)}
                    </div>

                    <Button
                      size="small"
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveIngredient(index)}
                    />
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