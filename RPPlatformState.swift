//
//  PlatformState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 02.02.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class PlatformState: State {

    var elapsedTime: TimeInterval = 0.0
    
    unowned var entity: PlatformEntity
    
    // MARK: Initializers
    
    required init(entity: PlatformEntity) {
        self.entity = entity
    }
    
    override func didEnter(from previousState: GKState?) {
        super.didEnter(from: previousState)
        elapsedTime = 0.0
    }
    
    override func update(deltaTime seconds: TimeInterval) {
        super.update(deltaTime: seconds)
        elapsedTime += seconds
    }
    
    override func contactWithEntityDidBegin(_ entity: GKEntity) {
        
    }
    
    override func contactWithEntityDidEnd(_ entity: GKEntity) {
        
    }
    
    // MARK: Deinitialization
    
    deinit {
        
        /* Debug Output to see if Entity was deallocated properly */
        print("Deinitialization: \(type(of: self))")
    }
}
