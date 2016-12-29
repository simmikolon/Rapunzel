//
//  IntelligenceComponent.swift
//  Rapunzel
//
//  Created by Simon Kemper on 30.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class StateMachineComponent: GKComponent, ContactNotifiableType {

    // MARK: Properties
    
    let stateMachine: GKStateMachine
    
    let initialStateClass: AnyClass
    
    // MARK: Initializers
    
    init(states: [GKState]) {
        stateMachine = GKStateMachine(states: states)
        initialStateClass = type(of: states.first!) as AnyClass
        super.init()
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    // MARK: GKComponent Life Cycle
    
    override func update(deltaTime seconds: TimeInterval) {
        super.update(deltaTime: seconds)
        
        stateMachine.update(deltaTime: seconds)
    }
    
    // MARK: Actions
    
    func enterInitialState() {
        
        stateMachine.enter(initialStateClass)
    }
    
    // MARK: Contact
    
    func contactWithEntityDidBegin(_ entity: GKEntity) {
        
        if let state = stateMachine.currentState as? State {
            
            state.contactWithEntityDidBegin(entity)
        }
    }
    
    func contactWithEntityDidEnd(_ entity: GKEntity) {

        if let state = stateMachine.currentState as? State {
            
            state.contactWithEntityDidEnd(entity)
        }
    }
    
    // MARK: Deinitialization
    
    deinit {
        
        /* Debug Output to see if Entity was deallocated properly */
        print("Deinitialization: \(type(of: self))")
    }
}
