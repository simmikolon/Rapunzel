//
//  RPInputManager-OSX.swift
//  Rapunzel
//
//  Created by Simon Kemper on 11.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import GameplayKit
import SpriteKit

struct RPInputHandlerSettings {
    
    static let AccelerationMultiplier: CGFloat = 1000.0
    static let AccelerometerUpdateInterval = 0.1
}

class RPInputManager {
    
    var inputSource: RPInputSource
    
    unowned let entityManager: RPEntityManager
    
    init(withEntityManager entityManager: RPEntityManager) {
        
        self.entityManager = entityManager
        self.inputSource = RPKeyboardInputSource()
    }
}
