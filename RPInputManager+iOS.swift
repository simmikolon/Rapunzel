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

class RPMotionInputSource {
    
    let motionManager = CMMotionManager()
    
    init() {
        
        motionManager.accelerometerUpdateInterval = RPInputHandlerSettings.AccelerometerUpdateInterval
        
        motionManager.startAccelerometerUpdatesToQueue(NSOperationQueue.currentQueue()!, withHandler: {
            (accelerometerData: CMAccelerometerData?, error: NSError?) in
            
        })
    }
}

class RPInputManager {
    
    unowned let entityManager: RPEntityManager
    
    let inputSource: RPInputSource
    
    init(withEntityManager entityManager: RPEntityManager, inputSource: RPInputSource) {
        
        self.entityManager = entityManager
        self.inputSource = inputSource
    }
}
