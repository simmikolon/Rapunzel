//
//  Ramp.swift
//  Rapunzel
//
//  Created by Simon Kemper on 17.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import Foundation

protocol RampDelegate: class {
    func ramp(_ ramp: Ramp, didChangeRampFactor rampFactor: Float)
}

class Ramp {
    
    weak var delegate: RampDelegate?
    
    fileprivate var rampTimer: Timer?
    fileprivate var rampFactor: Float = 0.0
    
    var rampIncrement: Float = 0.075
    var rampDecrement: Float = 0.05
    
    fileprivate let rampDownInterval: TimeInterval = 0.015
    fileprivate let rampUpInterval: TimeInterval = 0.01
    
    init(withIncrement increment: Float = 0.1, decrement: Float = 0.075) {
        
        rampIncrement = increment
        rampDecrement = decrement
    }
    
    func rampUp() {
        stopRampTimer()
        rampTimer = Timer.scheduledTimer(timeInterval: rampUpInterval, target: self, selector: #selector(rampUpAction), userInfo: nil, repeats: true)
    }
    
    fileprivate func stopRampTimer() {
        rampTimer?.invalidate()
    }
    
    func rampDown() {
        stopRampTimer()
        rampTimer = Timer.scheduledTimer(timeInterval: rampDownInterval, target: self, selector: #selector(rampDownAction), userInfo: nil, repeats: true)
    }
    
    @objc fileprivate func rampUpAction() {
        rampFactor += rampIncrement
        if rampFactor > 1.0 {
            rampFactor = 1.0
            rampTimer?.invalidate()
        }
        delegate?.ramp(self, didChangeRampFactor: rampFactor)
    }
    
    @objc fileprivate func rampDownAction() {
        rampFactor -= rampDecrement
        if rampFactor < 0.0 {
            rampFactor = 0.0
            rampTimer?.invalidate()
        }
        delegate?.ramp(self, didChangeRampFactor: rampFactor)
    }
}
