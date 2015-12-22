//
//  RPInputHandler.swift
//  RapunzelSwift
//
//  Created by Simon Kemper on 13.11.15.
//  Copyright © 2015 Simon Kemper. All rights reserved.
//

import UIKit
import SpriteKit
import CoreMotion

struct RPInputHandlerSettings {
    
    static let AccelerationMultiplier: CGFloat = 600.0
    static let AccelerometerUpdateInterval = 0.2
}

protocol InputHandlingNode: class {
    
    func inputHandlerDidChangeMotion(xAcceleration: CGFloat)
    func inputHandlerDidTap()
}

class RPInputHandler: RPObject {
    
    weak var delegate: InputHandlingNode?
    
    override func setup() {
        setupCoreMotion()
    }
    
    let motionManager = CMMotionManager()
    var xAcceleration: CGFloat = 0.0
    
    private func setupCoreMotion() {
        
        motionManager.accelerometerUpdateInterval = RPInputHandlerSettings.AccelerometerUpdateInterval
        
        motionManager.startAccelerometerUpdatesToQueue(NSOperationQueue.currentQueue()!, withHandler: {
            (accelerometerData: CMAccelerometerData?, error: NSError?) in
            
            let acceleration = accelerometerData!.acceleration
            self.xAcceleration = (CGFloat(acceleration.x) * 0.75) + (self.xAcceleration * 0.25)
            let xAcceleration = self.xAcceleration * RPInputHandlerSettings.AccelerationMultiplier

            self.delegate?.inputHandlerDidChangeMotion(xAcceleration)
        })
    }

    func touchesBegan(touches: Set<UITouch>, withEvent event: UIEvent?, andView view: SKView?) {
        
        delegate?.inputHandlerDidTap()
    }
    
    func touchesMoved(touches: Set<UITouch>, withEvent event: UIEvent?, andView view: SKView?) {
        
    }
    
    func touchesEnded(touches: Set<UITouch>, withEvent event: UIEvent?, andView view: SKView?) {
        
    }
}
