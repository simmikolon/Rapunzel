//
//  RPPlayerState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 30.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import GameplayKit

class RPPlayerState: GKState, ContactNotifiableType {
    
    static var allowedStates = [RPPlayerState:[RPPlayerState]]()
    var elapsedTime: NSTimeInterval = 0.0

    unowned var entity: RPPlayerEntity
    
    // MARK: Initializers
    
    required init(entity: RPPlayerEntity) {
        
        self.entity = entity
    }
    
    override func didEnterWithPreviousState(previousState: GKState?) {
        super.didEnterWithPreviousState(previousState)
        elapsedTime = 0.0
    }
    
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        
        if self.entity.physicsComponent.physicsBody.velocity.dy < 0 {

            self.entity.stateMachineComponent.stateMachine.enterState(RPPlayerFallingState.self)
        }
        
        elapsedTime += seconds
    }
    
    func contactWithEntityDidBegin(entity: GKEntity) {
        
    }
    
    func contactWithEntityDidEnd(entity: GKEntity) {
        
    }
}
