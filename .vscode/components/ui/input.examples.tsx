/**
 * Input Component Usage Examples - Number Input with Min/Max
 * 
 * This file demonstrates how to use the Input component with number type
 * and min/max constraints.
 */

import React from 'react'
import { Input } from './input'

export function NumberInputExamples() {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Number Input Examples</h2>

      {/* Basic number input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Basic Number Input</label>
        <Input
          type="number"
          placeholder="Enter any number"
        />
      </div>

      {/* Number input with min constraint */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Minimum Value (0)</label>
        <Input
          type="number"
          min={0}
          placeholder="Enter number ≥ 0"
        />
      </div>

      {/* Number input with max constraint */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Maximum Value (100)</label>
        <Input
          type="number"
          max={100}
          placeholder="Enter number ≤ 100"
        />
      </div>

      {/* Number input with min and max constraints */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Age (18-65)</label>
        <Input
          type="number"
          min={18}
          max={65}
          placeholder="Enter age between 18-65"
        />
      </div>

      {/* Number input with step constraint */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Score (0-100, increments of 5)</label>
        <Input
          type="number"
          min={0}
          max={100}
          step={5}
          placeholder="Enter score (0, 5, 10, 15...)"
        />
      </div>

      {/* Decimal number with step */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Price ($0.00-$999.99)</label>
        <Input
          type="number"
          min={0}
          max={999.99}
          step={0.01}
          placeholder="0.00"
        />
      </div>

      {/* Different sizes with number constraints */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Different Sizes</h3>

        <div className="space-y-2">
          <label className="text-sm font-medium">Small (Quantity 1-10)</label>
          <Input
            type="number"
            size="sm"
            min={1}
            max={10}
            defaultValue={1}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Medium (Percentage 0-100)</label>
          <Input
            type="number"
            size="md"
            min={0}
            max={100}
            step={1}
            placeholder="Enter percentage"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Large (Year 1900-2100)</label>
          <Input
            type="number"
            size="lg"
            min={1900}
            max={2100}
            defaultValue={2025}
          />
        </div>
      </div>

      {/* Different colors with number constraints */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Different Colors</h3>

        <div className="space-y-2">
          <label className="text-sm font-medium">Primary Color (Rating 1-5)</label>
          <Input
            type="number"
            color="primary"
            min={1}
            max={5}
            step={1}
            placeholder="Rate from 1 to 5"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Success Color (Progress 0-100%)</label>
          <Input
            type="number"
            color="success"
            min={0}
            max={100}
            step={1}
            placeholder="Enter progress percentage"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Warning Color (Temperature -50°C to 50°C)</label>
          <Input
            type="number"
            color="warning"
            min={-50}
            max={50}
            step={0.1}
            placeholder="Enter temperature"
          />
        </div>
      </div>

      {/* Real-world examples */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Real-world Examples</h3>

        {/* Flight duration */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Flight Duration (Hours)</label>
          <Input
            type="number"
            min={0.5}
            max={20}
            step={0.1}
            placeholder="Enter flight duration in hours"
          />
        </div>

        {/* Aircraft capacity */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Aircraft Capacity</label>
          <Input
            type="number"
            min={1}
            max={850}
            step={1}
            placeholder="Enter passenger capacity"
          />
        </div>

        {/* Fuel quantity */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Fuel Quantity (Liters)</label>
          <Input
            type="number"
            min={0}
            max={500000}
            step={0.1}
            placeholder="Enter fuel quantity"
          />
        </div>

        {/* Altitude */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Cruising Altitude (feet)</label>
          <Input
            type="number"
            min={1000}
            max={50000}
            step={100}
            placeholder="Enter altitude in feet"
          />
        </div>
      </div>

      {/* Form validation example */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">With Form Validation</h3>

        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Minimum Passengers</label>
              <Input
                type="number"
                name="minPassengers"
                min={1}
                max={850}
                required
                placeholder="Min passengers"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Maximum Passengers</label>
              <Input
                type="number"
                name="maxPassengers"
                min={1}
                max={850}
                required
                placeholder="Max passengers"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Departure Hour</label>
              <Input
                type="number"
                name="departureHour"
                min={0}
                max={23}
                step={1}
                placeholder="0-23"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Departure Minute</label>
              <Input
                type="number"
                name="departureMinute"
                min={0}
                max={59}
                step={1}
                placeholder="0-59"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Gate Number</label>
              <Input
                type="number"
                name="gateNumber"
                min={1}
                max={200}
                step={1}
                placeholder="1-200"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NumberInputExamples