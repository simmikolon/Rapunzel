//
//  Ramp.swift
//  Rapunzel
//
//  Created by Simon Kemper on 17.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import Foundation

protocol RampDelegate: class {
    func ramp(ramp: Ramp, didChangeRampFactor rampFactor: Float)
}

class Ramp {
    
    weak var delegate: RampDelegate?
    
    private var rampTimer: NSTimer?
    private var rampFactor: Float = 0.0
    
    var rampIncrement: Float = 0.075
    var rampDecrement: Float = 0.05
    
    private let rampDownInterval: NSTimeInterval = 0.015
    private let rampUpInterval: NSTimeInterval = 0.01
    
    init(withIncrement increment: Float = 0.075, decrement: Float = 0.05) {
        
        rampIncrement = increment
        rampDecrement = decrement
    }
    
    func rampUp() {
        stopRampTimer()
        rampTimer = NSTimer.scheduledTimerWithTimeInterval(rampUpInterval, target: self, selector: #selector(rampUpAction), userInfo: nil, repeats: true)
    }
    
    private func stopRampTimer() {
        rampTimer?.invalidate()
    }
    
    func rampDown() {
        stopRampTimer()
        rampTimer = NSTimer.scheduledTimerWithTimeInterval(rampDownInterval, target: self, selector: #selector(rampDownAction), userInfo: nil, repeats: true)
    }
    
    @objc private func rampUpAction() {
        rampFactor += rampIncrement
        if rampFactor > 1.0 {
            rampFactor = 1.0
            rampTimer?.invalidate()
        }
        delegate?.ramp(self, didChangeRampFactor: rampFactor)
    }
    
    @objc private func rampDownAction() {
        rampFactor -= rampDecrement
        if rampFactor < 0.0 {
            rampFactor = 0.0
            rampTimer?.invalidate()
        }
        delegate?.ramp(self, didChangeRampFactor: rampFactor)
    }
}
