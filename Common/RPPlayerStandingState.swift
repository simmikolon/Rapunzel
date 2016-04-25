//
//  RPPlayerStandingState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 30.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import GameplayKit

class RPPlayerStandingState: RPPlayerState {

    // MARK: GKState Life Cycle
    
    override func didEnterWithPreviousState(previousState: GKState?) {
        super.didEnterWithPreviousState(previousState)
        self.entity.physicsComponent.physicsBody.pinned = true
    }
    
    override func isValidNextState(stateClass: AnyClass) -> Bool {
        if stateClass is RPPlayerBoostState.Type {
            return true
        }
        if stateClass is RPPlayerJumpingState.Type {
            return true
        }
        
        return false
    }
    
    override func willExitWithNextState(nextState: GKState) {
        super.willExitWithNextState(nextState)
        self.entity.physicsComponent.physicsBody.pinned = false
    }
}
