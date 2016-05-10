//
//  RPInputManagerEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 10.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import CoreMotion
import GameplayKit
import SpriteKit

struct RPInputHandlerSettings {
    
    static let AccelerationMultiplier: CGFloat = 1000.0
    static let AccelerometerUpdateInterval = 0.1
}

class RPInputManagerEntity: RPEntity {

    let motionManager = CMMotionManager()
    var xAcceleration: CGFloat = 0.0
    var isStopped = true
    
    unowned let entityManagerComponent: RPEntityManagerComponent
    
    init(withEntityManagerComponent entityManagerComponent: RPEntityManagerComponent) {
        
        self.entityManagerComponent = entityManagerComponent
        super.init()
        startMotionUpdates()
    }
    
    func stopMotionUpdates() {
        
        if !isStopped {
            
            motionManager.stopAccelerometerUpdates()
            isStopped = true
        }
    }
    
    func startMotionUpdates() {

        if isStopped {
        
            motionManager.accelerometerUpdateInterval = RPInputHandlerSettings.AccelerometerUpdateInterval
            
            motionManager.startAccelerometerUpdatesToQueue(NSOperationQueue.currentQueue()!, withHandler: {
                (accelerometerData: CMAccelerometerData?, error: NSError?) in
                
                let acceleration = accelerometerData!.acceleration
                self.xAcceleration = (CGFloat(acceleration.x) * 0.5) + (self.xAcceleration * 0.75)
                let xAcceleration = self.xAcceleration * RPInputHandlerSettings.AccelerationMultiplier
                
                for componentSystem in self.entityManagerComponent.componentSystems {
                    
                    if componentSystem.componentClass == RPInputComponent.self {
                        
                        for component: GKComponent in componentSystem.components {
                            
                            if let inputComponent: RPInputComponent = component as? RPInputComponent {
                                
                                inputComponent.didChangeMotion(xAcceleration)
                            }
                        }
                    }
                }
            })
            
            isStopped = false
        }
    }
}
