

import React, { useState, useEffect } from 'react';
import styles from './RollingInput.module.css';

interface RollingInputProps {
    value: number;
    onChange: (val: number) => void;
    step?: number;
    min?: number;
    max?: number;
    suffix?: string;
    placeholder?: string;
}

export default function RollingInput({ value, onChange, step = 1, min = 0, suffix = '', placeholder }: RollingInputProps) {
    const [localValue, setLocalValue] = useState(value.toString());

    useEffect(() => {
        setLocalValue(value.toString());
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;
        setLocalValue(newVal);

        const parsed = parseFloat(newVal);
        if (!isNaN(parsed) && parsed >= min) {
            onChange(parsed);
        } else if (newVal === '') {
            // Allow empty string while typing, but don't fire invalid onChange
        }
    };

    const handleBlur = () => {
        const parsed = parseFloat(localValue);
        if (isNaN(parsed) || parsed < min) {
            setLocalValue(value.toString()); // Revert if invalid
        } else {
            onChange(parsed);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.inputWrapper}>
                <input
                    type="number"
                    className={styles.input}
                    value={localValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    min={min}
                    step={step}
                    placeholder={placeholder}
                />
                {suffix && <span className={styles.suffix}>{suffix}</span>}
            </div>
        </div>
    );
}
