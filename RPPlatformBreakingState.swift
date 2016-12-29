//
//  PlatformBreakingState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 02.02.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import GameplayKit
import SpriteKit

class PlatformBreakingState: PlatformState {

    override func didEnter(from previousState: GKState?) {
        super.didEnter(from: previousState)
        let action = SKAction.fadeOut(withDuration: 0.5)
        entity.renderComponent.node.run(action)
    }
    
    override func update(deltaTime seconds: TimeInterval) {
        super.update(deltaTime: seconds)
        
        if elapsedTime > 0.5 {
            
            self.entity.remove()
        }
    }
    
    override func isValidNextState(_ stateClass: AnyClass) -> Bool {
        return true
    }
    
    override func willExit(to nextState: GKState) {
        super.willExit(to: nextState)
    }
    
    override func contactWithEntityDidBegin(_ entity: GKEntity) {
        
    }
    
    override func contactWithEntityDidEnd(_ entity: GKEntity) {
        
    }
}
