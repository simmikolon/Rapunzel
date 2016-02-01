//
//  RPIntelligenceComponent.swift
//  Rapunzel
//
//  Created by Simon Kemper on 30.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class RPStateMachineComponent: GKComponent, ContactNotifiableType {

    // MARK: Properties
    
    let stateMachine: GKStateMachine
    
    let initialStateClass: AnyClass
    
    // MARK: Initializers
    
    init(states: [GKState]) {
        stateMachine = GKStateMachine(states: states)
        initialStateClass = states.first!.dynamicType
    }
    
    // MARK: GKComponent Life Cycle
    
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        super.updateWithDeltaTime(seconds)
        
        stateMachine.updateWithDeltaTime(seconds)
    }
    
    // MARK: Actions
    
    func enterInitialState() {
        
        stateMachine.enterState(initialStateClass)
    }
    
    // MARK: Contact
    
    func contactWithEntityDidBegin(entity: GKEntity) {
        
        if let state = stateMachine.currentState as? RPPlayerState {
            
            state.contactWithEntityDidBegin(entity)
        }
    }
    
    func contactWithEntityDidEnd(entity: GKEntity) {

        if let state = stateMachine.currentState as? RPPlayerState {
            
            state.contactWithEntityDidEnd(entity)
        }
    }
}
