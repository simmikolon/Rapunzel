//
//  RPPlatformState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 02.02.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class RPPlatformState: RPState {

    var elapsedTime: NSTimeInterval = 0.0
    
    unowned var entity: RPPlatformEntity
    
    // MARK: Initializers
    
    required init(entity: RPPlatformEntity) {
        
        self.entity = entity
    }
    
    override func didEnterWithPreviousState(previousState: GKState?) {
        super.didEnterWithPreviousState(previousState)
        elapsedTime = 0.0
    }
    
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        super.updateWithDeltaTime(seconds)
        elapsedTime += seconds
    }
    
    override func contactWithEntityDidBegin(entity: GKEntity) {
        
    }
    
    override func contactWithEntityDidEnd(entity: GKEntity) {
        
    }
    
    // MARK: Deinitialization
    
    deinit {
        
        /* Debug Output to see if Entity was deallocated properly */
        print("Deinitialization: \(self.dynamicType)")
    }
}
