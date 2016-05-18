/*
    Copyright (C) 2015 Apple Inc. All Rights Reserved.
    See LICENSE.txt for this sample’s licensing information
    
    Abstract:
    An implementation of the `ControlInputSourceType` protocol that enables support for touch-based thumbsticks on iOS.
*/

import SpriteKit
import CoreMotion

struct MotionInputSourceSettings {
    
    static let AccelerometerUpdateInterval = 0.1
}

class TouchControlInputNode: SKSpriteNode, InputSource {
    // MARK: Properties
    
    /// `ControlInputSourceType` delegates.
    weak var gameStateDelegate: InputSourceGameStateDelegate?
    weak var delegate: InputSourceDelegate?
    
    let motionManager = CMMotionManager()
    
    let allowsStrafing = true
    
    /// Node representing the touch area for the pause button.
    let pauseButton: SKSpriteNode
    
    /// Sets used to keep track of touches, and their relevant controls.
    var leftControlTouches = Set<UITouch>()
    var rightControlTouches = Set<UITouch>()
    
    /// The width of the zone in the center of the screen where the touch controls cannot be placed.
    let centerDividerWidth: CGFloat

    // MARK: Initialization
    
    /*
        `TouchControlInputNode` is intended as an overlay for the entire screen,
        therefore the `frame` is usually the scene's bounds or something equivalent.
    */
    init(frame: CGRect, thumbStickNodeSize: CGSize) {
        
        // An approximate width appropriate for different scene sizes.
        centerDividerWidth = frame.width / 4.5

        // Setup pause button.
        let buttonSize = CGSize(width: frame.height / 4, height: frame.height / 4)
        pauseButton = SKSpriteNode(texture: nil, color: UIColor.clearColor(), size: buttonSize)
        pauseButton.position = CGPoint(x: 0, y: frame.height / 2)
        
        super.init(texture: nil, color: UIColor.clearColor(), size: frame.size)
        //rightThumbStickNode.delegate = self
        //leftThumbStickNode.delegate = self
        
        //addChild(leftThumbStickNode)
        //addChild(rightThumbStickNode)
        addChild(pauseButton)
        
        /*
            A `TouchControlInputNode` is designed to receive all user interaction
            and forwards it along to the child nodes.
        */
        userInteractionEnabled = true
        
        startMotionUpdates()
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    // MARK: - Core Motion
    
    private func startMotionUpdates() {
        
        motionManager.accelerometerUpdateInterval = MotionInputSourceSettings.AccelerometerUpdateInterval
        motionManager.startAccelerometerUpdatesToQueue(NSOperationQueue.currentQueue()!, withHandler: {
            (accelerometerData: CMAccelerometerData?, error: NSError?) in
            
            if let accelerometerData = accelerometerData {
                
                let displacement = float2(Float(accelerometerData.acceleration.x), Float(accelerometerData.acceleration.y))
                self.delegate?.inputSource(self, didUpdateDisplacement: displacement)
            }
        })
    }

    // MARK: ControlInputSourceType
    
    func resetControlState() {
        // Nothing to do here.
    }
    
    // MARK: UIResponder
    
    override func touchesBegan(touches: Set<UITouch>, withEvent event: UIEvent?) {
        super.touchesBegan(touches, withEvent: event)
    }
    
    override func touchesMoved(touches: Set<UITouch>, withEvent event: UIEvent?) {
        super.touchesMoved(touches, withEvent: event)
    }
    
    override func touchesEnded(touches: Set<UITouch>, withEvent event: UIEvent?) {
        super.touchesEnded(touches, withEvent: event)
        
        for touch in touches {
            let touchPoint = touch.locationInNode(self)
            
            /// Toggle pause when touching in the pause node.
            if pauseButton === nodeAtPoint(touchPoint) {
                gameStateDelegate?.inputSourceDidTogglePauseState(self)
                break
            }
        }
        
        let endedLeftTouches = touches.intersect(leftControlTouches)
        leftControlTouches.subtractInPlace(endedLeftTouches)
        
        let endedRightTouches = touches.intersect(rightControlTouches)
        rightControlTouches.subtractInPlace(endedRightTouches)
    }
    
    override func touchesCancelled(touches: Set<UITouch>?, withEvent event: UIEvent?) {
        super.touchesCancelled(touches, withEvent: event)
        
        //leftThumbStickNode.resetTouchPad()
        //rightThumbStickNode.resetTouchPad()
        
        // Keep the set's capacity, because roughly the same number of touch events are being received.
        leftControlTouches.removeAll(keepCapacity: true)
        rightControlTouches.removeAll(keepCapacity: true)
    }
}