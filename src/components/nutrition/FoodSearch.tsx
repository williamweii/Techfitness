"use client";

import React, { useState } from 'react';
import { Search, Plus, X } from 'lucide-react';
import styles from './FoodSearch.module.css';

interface FoodSearchProps {
    onClose: () => void;
    onAddFood: (food: any) => void;
    initialFood?: any;
}

const MOCK_DB = [
    {
        id: 1, name: '雞胸肉', unit: 'g', baseWeight: 100,
        calories: 165, protein: 31, carbs: 0, fat: 3.6,
        vitA: 0, vitC: 0, vitD: 0, iron: 1, calcium: 15, magnesium: 28
    },
    {
        id: 2, name: '白飯', unit: 'g', baseWeight: 100,
        calories: 130, protein: 2.7, carbs: 28, fat: 0.3,
        vitA: 0, vitC: 0, vitD: 0, iron: 0.2, calcium: 10, magnesium: 12
    },
    {
        id: 3, name: '雞蛋', unit: '顆', baseWeight: 1,
        calories: 70, protein: 6, carbs: 0.6, fat: 5,
        vitA: 540, vitC: 0, vitD: 44, iron: 0.9, calcium: 25, magnesium: 5
    },
];

export default function FoodSearch({ onClose, onAddFood, initialFood }: FoodSearchProps) {
    const [query, setQuery] = useState('');
    const [selectedFood, setSelectedFood] = useState<any>(initialFood?.baseFood || initialFood || null);
    const [weight, setWeight] = useState<string>(initialFood?.loggedWeight?.toString() || '');
    const [showCustomForm, setShowCustomForm] = useState(false);
    const [savedCustomFoods, setSavedCustomFoods] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('customFoods');
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });
    const [customFoodData, setCustomFoodData] = useState({
        name: '',
        unit: 'g',
        calories: '',
        protein: '',
        carbs: '',
        fat: ''
    });

    const results = MOCK_DB.filter(food =>
        food.name.includes(query)
    );

    const handleConfirmAdd = () => {
        if (!selectedFood) return;
        const w = parseFloat(weight) || selectedFood.baseWeight;
        const ratio = w / selectedFood.baseWeight;

        const finalFood = {
            ...selectedFood,
            id: initialFood?.id || Date.now(),
            baseFood: selectedFood, // Keep original for re-editing
            loggedWeight: w,
            name: `${selectedFood.name} (${w}${selectedFood.unit})`,
            calories: Math.round(selectedFood.calories * ratio),
            protein: parseFloat((selectedFood.protein * ratio).toFixed(1)),
            carbs: parseFloat((selectedFood.carbs * ratio).toFixed(1)),
            fat: parseFloat((selectedFood.fat * ratio).toFixed(1)),
            micronutrients: {
                vitA: Math.round(selectedFood.vitA * ratio),
                vitC: Math.round(selectedFood.vitC * ratio),
                vitD: Math.round(selectedFood.vitD * ratio),
                iron: parseFloat((selectedFood.iron * ratio).toFixed(1)),
                calcium: Math.round(selectedFood.calcium * ratio),
                magnesium: Math.round(selectedFood.magnesium * ratio),
            }
        };
        onAddFood(finalFood);
    };

    const handleConfirmCustom = () => {
        if (!customFoodData.name || !customFoodData.calories) return;

        const newFood = {
            id: Date.now(),
            name: customFoodData.name,
            unit: customFoodData.unit || 'g',
            baseWeight: 100, // Default for easy calculation
            calories: parseInt(customFoodData.calories),
            protein: parseFloat(customFoodData.protein) || 0,
            carbs: parseFloat(customFoodData.carbs) || 0,
            fat: parseFloat(customFoodData.fat) || 0,
            micronutrients: { vitA: 0, vitC: 0, vitD: 0, iron: 0, calcium: 0, magnesium: 0 }
        };

        const updatedSaved = [newFood, ...savedCustomFoods].slice(0, 10);
        setSavedCustomFoods(updatedSaved);
        localStorage.setItem('customFoods', JSON.stringify(updatedSaved));
        onAddFood(newFood);
    };

    if (showCustomForm) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h3>手動新增食物</h3>
                    <button onClick={() => setShowCustomForm(false)} className={styles.closeBtn}><X size={20} /></button>
                </div>
                <div className={styles.customForm}>
                    <div className={styles.formGroup}>
                        <label>食物名稱</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="例如：自製沙拉"
                            value={customFoodData.name}
                            onChange={e => setCustomFoodData({ ...customFoodData, name: e.target.value })}
                        />
                    </div>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>單位 (預設 g)</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={customFoodData.unit}
                                placeholder="g"
                                onChange={e => setCustomFoodData({ ...customFoodData, unit: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>熱量 (kcal)</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={customFoodData.calories}
                                min="0"
                                onChange={e => setCustomFoodData({ ...customFoodData, calories: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>蛋白質 (g)</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={customFoodData.protein}
                                min="0"
                                onChange={e => setCustomFoodData({ ...customFoodData, protein: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>碳水 (g)</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={customFoodData.carbs}
                                min="0"
                                onChange={e => setCustomFoodData({ ...customFoodData, carbs: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>脂肪 (g)</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={customFoodData.fat}
                                min="0"
                                onChange={e => setCustomFoodData({ ...customFoodData, fat: e.target.value })}
                            />
                        </div>
                    </div>
                    <button onClick={handleConfirmCustom} className={styles.confirmBtn}>確認並新增</button>
                </div>
            </div>
        );
    }

    if (selectedFood) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h3>{selectedFood.name}</h3>
                    <button onClick={() => setSelectedFood(null)} className={styles.closeBtn}><X size={20} /></button>
                </div>
                <div className={styles.detailView}>
                    <div className={styles.weightInput}>
                        <label>輸入份量 ({selectedFood.unit})</label>
                        <input
                            type="number"
                            value={weight}
                            placeholder={selectedFood.baseWeight.toString()}
                            onChange={(e) => setWeight(e.target.value)}
                            min="0"
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.previewMacros}>
                        <div className={styles.previewItem}>
                            <span>熱量</span>
                            <span>{Math.round(selectedFood.calories * ((parseFloat(weight) || selectedFood.baseWeight) / selectedFood.baseWeight))} kcal</span>
                        </div>
                    </div>
                    <button onClick={handleConfirmAdd} className={styles.confirmBtn}>確認新增</button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.searchBar}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="搜尋食物..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className={styles.input}
                        autoFocus
                    />
                </div>
                <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
            </div>

            <div className={styles.results}>
                {results.map(food => (
                    <div key={food.id} className={styles.item}>
                        <div className={styles.itemInfo}>
                            <h4>{food.name}</h4>
                            <p>{food.calories} kcal • P: {food.protein} • C: {food.carbs} • F: {food.fat}</p>
                        </div>
                        <button onClick={() => setSelectedFood(food)} className={styles.addBtn}><Plus size={20} /></button>
                    </div>
                ))}

                {savedCustomFoods.length > 0 && query === '' && (
                    <div className={styles.savedSection}>
                        <p className={styles.sectionTitle}>最近新增的自訂食物</p>
                        {savedCustomFoods.map(food => (
                            <div key={food.id} className={styles.item}>
                                <div className={styles.itemInfo}>
                                    <h4>{food.name}</h4>
                                    <p>{food.calories} kcal • {food.unit}</p>
                                </div>
                                <button onClick={() => setSelectedFood(food)} className={styles.addBtn}><Plus size={20} /></button>
                            </div>
                        ))}
                    </div>
                )}

                <div className={styles.customAdd} onClick={() => setShowCustomForm(true)}>
                    <Plus size={16} />
                    <span>手動新增自訂食物</span>
                </div>

                {results.length === 0 && query && (
                    <div className={styles.noResults}>
                        <p>找不到食物？嘗試其他關鍵字</p>
                    </div>
                )}
            </div>
        </div>
    );
}
